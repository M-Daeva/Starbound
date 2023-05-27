#[cfg(not(feature = "library"))]
use cosmwasm_std::{
    coin, Addr, BankMsg, CosmosMsg, Decimal, DepsMut, Env, IbcMsg, IbcTimeout, MessageInfo,
    Response, StdError, Uint128,
};

use crate::{
    actions::{
        helpers::{
            math::transfer_router,
            verifier::{get_addr_by_prefix, verify_deposit_data, verify_scheduler},
        },
        query::query_pools_and_users,
    },
    error::ContractError,
    messages::query::QueryPoolsAndUsersResponse,
    state::{
        AddrUnchecked, Asset, Config, Denom, Pool, TransferParams, User, CONFIG, EXCHANGE_DENOM,
        EXCHANGE_PREFIX, IBC_TIMEOUT_IN_MINS, LEDGER, POOLS, USERS,
    },
};

pub fn deposit(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    asset_list: Vec<Asset>,
    is_rebalancing_used: bool,
    day_counter: Uint128,
) -> Result<Response, ContractError> {
    verify_deposit_data(&deps, &info, &asset_list, is_rebalancing_used, day_counter)?;

    let config = CONFIG.load(deps.storage)?;
    let denom_token_in = config.stablecoin_denom;

    // check if user exists or create new
    let user_loaded = USERS.load(deps.storage, &info.sender).unwrap_or_default();

    // update asset list
    let mut asset_list = asset_list
        .iter()
        .map(|asset| -> Result<Asset, ContractError> {
            // check if asset is in pool
            if (asset.asset_denom != EXCHANGE_DENOM)
                && POOLS.load(deps.storage, &asset.asset_denom).is_err()
            {
                Err(ContractError::AssetIsNotFound {})?;
            };

            // search same denom asset and preserve amount_to_transfer if asset is found
            let amount_to_transfer = user_loaded
                .asset_list
                .iter()
                .find(|&x| (x.asset_denom == asset.asset_denom))
                .map_or(Uint128::zero(), |y| y.amount_to_transfer);

            Ok(Asset {
                amount_to_transfer,
                ..asset.to_owned()
            })
        })
        .collect::<Result<Vec<Asset>, ContractError>>()?;

    // received asset_list is empty just take it from user_loaded
    if asset_list.is_empty() {
        asset_list = user_loaded.asset_list;
    }

    let funds_amount = info
        .funds
        .iter()
        .find(|&x| x.denom == denom_token_in)
        .map_or(Uint128::zero(), |x| x.amount);

    USERS.save(
        deps.storage,
        &info.sender,
        &User {
            asset_list,
            deposited: user_loaded.deposited + funds_amount,
            day_counter,
            is_rebalancing_used,
        },
    )?;

    Ok(Response::new().add_attributes(vec![
        ("method", "deposit"),
        ("user_deposited", &funds_amount.to_string()),
    ]))
}

pub fn withdraw(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    amount: Uint128,
) -> Result<Response, ContractError> {
    let config = CONFIG.load(deps.storage)?;
    let denom_token_out = config.stablecoin_denom;

    let user = USERS.update(
        deps.storage,
        &info.sender,
        |some_user| -> Result<User, ContractError> {
            let user = some_user.ok_or(ContractError::UserIsNotFound {})?;

            // check withdraw amount
            if amount > user.deposited {
                Err(ContractError::WithdrawAmountIsExceeded {})?;
            }

            Ok(User {
                deposited: user.deposited - amount,
                ..user
            })
        },
    )?;

    let msg = CosmosMsg::Bank(BankMsg::Send {
        to_address: info.sender.to_string(),
        amount: vec![coin(amount.u128(), denom_token_out)],
    });

    Ok(Response::new().add_message(msg).add_attributes(vec![
        ("method", "withdraw"),
        ("user_deposited", &user.deposited.to_string()),
    ]))
}

#[allow(clippy::too_many_arguments)]
pub fn update_config(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    scheduler: Option<AddrUnchecked>,
    stablecoin_denom: Option<Denom>,
    stablecoin_pool_id: Option<u64>,
    fee_default: Option<Decimal>,
    fee_osmo: Option<Decimal>,
    dapp_address_and_denom_list: Option<Vec<(AddrUnchecked, Denom)>>,
) -> Result<Response, ContractError> {
    CONFIG.update(
        deps.storage,
        |mut config| -> Result<Config, ContractError> {
            if info.sender != config.admin {
                Err(ContractError::Unauthorized {})?;
            }

            if let Some(x) = scheduler {
                config.scheduler = deps.api.addr_validate(&x)?;
            }

            if let Some(x) = stablecoin_denom {
                // pool id must be updated same time as denom
                config.stablecoin_denom = x;
                config.stablecoin_pool_id =
                    stablecoin_pool_id.ok_or(ContractError::StablePoolIdIsNotUpdated {})?;
            }

            if let Some(x) = fee_default {
                config.fee_default = x;
            }

            if let Some(x) = fee_osmo {
                config.fee_osmo = x;
            }

            if let Some(x) = dapp_address_and_denom_list {
                let mut verified_list: Vec<(Addr, String)> = vec![];

                for (address, denom) in x {
                    verified_list.push((
                        deps.api
                            .addr_validate(&get_addr_by_prefix(&address, EXCHANGE_PREFIX)?)?,
                        denom,
                    ));
                }

                config.dapp_address_and_denom_list = verified_list;
            }

            Ok(config)
        },
    )?;

    Ok(Response::new().add_attributes(vec![("method", "update_config")]))
}

pub fn update_pools_and_users(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    pools: Vec<(Denom, Pool)>,
    users: Vec<(AddrUnchecked, User)>,
) -> Result<Response, ContractError> {
    verify_scheduler(&deps, &info)?;

    // update pools info
    for (denom, pool_received) in pools {
        if POOLS
            .save(
                deps.storage,
                &denom,
                &Pool::new(
                    pool_received.id,
                    pool_received.price,
                    &pool_received.channel_id,
                    &pool_received.port_id,
                    &pool_received.symbol,
                ),
            )
            .is_err()
        {
            Err(ContractError::PoolIsNotUpdated {})?;
        };
    }

    // update users info
    for (address_unchecked, user_received) in users {
        // validate address
        let address = deps.api.addr_validate(&address_unchecked)?;

        // get user from storage by address
        let user_loaded = USERS
            .load(deps.storage, &address)
            .map_err(|_| ContractError::UserIsNotFound {})?;

        // update user assets (wallet balances)
        let asset_list = user_loaded
            .asset_list
            .iter()
            .map(|asset_loaded| -> Result<Asset, ContractError> {
                // check if asset is in pool
                if (asset_loaded.asset_denom != EXCHANGE_DENOM)
                    && POOLS.load(deps.storage, &asset_loaded.asset_denom).is_err()
                {
                    Err(ContractError::AssetIsNotFound {})?;
                };

                // search same denom
                let asset_received = user_received
                    .asset_list
                    .iter()
                    .find(|&x| (x.asset_denom == asset_loaded.asset_denom))
                    .ok_or(ContractError::AssetIsNotFound {})?;

                Ok(Asset {
                    wallet_balance: asset_received.wallet_balance,
                    ..asset_loaded.to_owned()
                })
            })
            .collect::<Result<Vec<Asset>, ContractError>>()?;

        USERS.save(
            deps.storage,
            &address,
            &User {
                asset_list,
                ..user_loaded
            },
        )?;
    }

    Ok(Response::new().add_attributes(vec![("method", "update_pools_and_users")]))
}

pub fn swap(deps: DepsMut, _env: Env, info: MessageInfo) -> Result<Response, ContractError> {
    verify_scheduler(&deps, &info)?;

    Ok(Response::new().add_attributes(vec![("method", "swap")]))
}

pub fn transfer(deps: DepsMut, env: Env, info: MessageInfo) -> Result<Response, ContractError> {
    verify_scheduler(&deps, &info)?;

    let QueryPoolsAndUsersResponse { pools, users } =
        query_pools_and_users(deps.as_ref(), env.clone())?;

    let ledger = LEDGER.load(deps.storage)?;

    let Config {
        stablecoin_denom,
        fee_default,
        fee_osmo,
        dapp_address_and_denom_list,
        ..
    } = CONFIG.load(deps.storage)?;
    let timestamp = env.block.time.plus_seconds(IBC_TIMEOUT_IN_MINS * 60);

    let contract_balances = deps.querier.query_all_balances(env.contract.address)?;

    let (users_updated, msg_list) = transfer_router(
        &pools,
        &users,
        contract_balances,
        ledger,
        fee_default,
        fee_osmo,
        dapp_address_and_denom_list,
        &stablecoin_denom,
        timestamp,
    );

    // update users
    for (address, user) in users_updated {
        USERS.save(deps.storage, &address, &user)?;
    }

    CONFIG.update(deps.storage, |mut x| -> Result<Config, StdError> {
        x.timestamp = timestamp;
        Ok(x)
    })?;

    Ok(Response::new()
        .add_messages(msg_list)
        .add_attributes(vec![("method", "transfer")]))
}

// function for testing ibc transfers
pub fn multi_transfer(
    _deps: DepsMut,
    env: Env,
    _info: MessageInfo,
    params: Vec<TransferParams>,
) -> Result<Response, ContractError> {
    let timestamp = env.block.time.plus_seconds(IBC_TIMEOUT_IN_MINS * 60);

    let msg_list = params
        .iter()
        .map(|x| {
            CosmosMsg::Ibc(IbcMsg::Transfer {
                channel_id: x.channel_id.to_owned(),
                to_address: x.to.to_owned(),
                amount: coin(x.amount.u128(), x.denom.to_owned()),
                timeout: IbcTimeout::with_timestamp(timestamp),
            })
        })
        .collect::<Vec<CosmosMsg>>();

    Ok(Response::new()
        .add_messages(msg_list)
        .add_attributes(vec![("method", "multi_transfer")]))
}
