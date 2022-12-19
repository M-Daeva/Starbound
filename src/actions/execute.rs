#[cfg(not(feature = "library"))]
use cosmwasm_std::{
    coin, Addr, BankMsg, CosmosMsg, Decimal, DepsMut, Env, IbcMsg, IbcTimeout, IbcTimeoutBlock,
    MessageInfo, Order, Response, StdResult, Uint128,
};

use osmosis_std::types::{
    cosmos::base::v1beta1::Coin as PoolCoin,
    osmosis::gamm::v1beta1::{MsgSwapExactAmountIn, SwapAmountInRoute},
};
use std::ops::Mul;

use crate::{
    actions::{
        rebalancer::{dec_to_u128, get_ledger, transfer_router, u128_to_dec},
        verifier::{verify_deposit_data, verify_scheduler, LocalApi},
    },
    error::ContractError,
    state::{
        Asset, Config, Ledger, Pool, PoolExtracted, TransferParams, User, UserExtracted, CONFIG,
        LEDGER, POOLS, USERS,
    },
};

pub fn deposit(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    user: User,
) -> Result<Response, ContractError> {
    verify_deposit_data(&deps, &info, &user)?;

    // check if user exists or create new
    let user_loaded = match USERS.load(deps.storage, &info.sender) {
        Ok(x) => x,
        _ => User::new(&vec![], Uint128::zero(), Uint128::zero(), false),
    };

    // update asset list
    let asset_list = user
        .asset_list
        .iter()
        .map(|asset| -> Result<Asset, ContractError> {
            // check if asset is in pool
            if POOLS.load(deps.storage, &asset.asset_denom).is_err() {
                return Err(ContractError::AssetIsNotFound {});
            };

            // search same denom asset
            Ok(
                match user_loaded
                    .asset_list
                    .iter()
                    .find(|&x| (x.asset_denom == asset.asset_denom))
                {
                    // preserve amount_to_send_until_next_epoch if asset is found
                    Some(y) => Asset {
                        amount_to_send_until_next_epoch: y.amount_to_send_until_next_epoch,
                        ..asset.to_owned()
                    },
                    // add new if asset is not found
                    _ => Asset {
                        amount_to_send_until_next_epoch: Uint128::zero(),
                        ..asset.to_owned()
                    },
                },
            )
        })
        .collect::<Result<Vec<Asset>, ContractError>>()?;

    USERS.save(
        deps.storage,
        &info.sender,
        &User {
            asset_list,
            deposited: user_loaded.deposited + user.deposited,
            ..user
        },
    )?;

    Ok(Response::new().add_attributes(vec![
        ("method", "deposit"),
        ("user_deposited", &user.deposited.to_string()),
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
                return Err(ContractError::WithdrawAmountIsExceeded {});
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
    scheduler: Option<String>,
    stablecoin_denom: Option<String>,
    stablecoin_pool_id: Option<u64>,
    fee_default: Option<Decimal>,
    fee_osmo: Option<Decimal>,
    dapp_address_and_denom_list: Option<Vec<(String, String)>>,
) -> Result<Response, ContractError> {
    CONFIG.update(
        deps.storage,
        |mut config| -> Result<Config, ContractError> {
            if info.sender != config.admin {
                return Err(ContractError::Unauthorized {});
            }

            if let Some(scheduler) = scheduler {
                config = Config {
                    scheduler: deps.api.addr_validate(&scheduler)?,
                    ..config
                };
            }

            if let Some(stablecoin_denom) = stablecoin_denom {
                // pool id must be updated same time as denom
                config = Config {
                    stablecoin_denom,
                    stablecoin_pool_id: stablecoin_pool_id
                        .ok_or(ContractError::StablePoolIdIsNotUpdated {})?,
                    ..config
                };
            }

            if let Some(fee_default) = fee_default {
                config = Config {
                    fee_default,
                    ..config
                };
            }

            if let Some(fee_osmo) = fee_osmo {
                config = Config { fee_osmo, ..config };
            }

            if let Some(dapp_address_and_denom_list) = dapp_address_and_denom_list {
                let mut verified_list: Vec<(Addr, String)> = vec![];
                let api = LocalApi::default();

                for (address, denom) in dapp_address_and_denom_list {
                    verified_list.push((api.addr_validate(&address)?, denom));
                }

                config = Config {
                    dapp_address_and_denom_list: verified_list,
                    ..config
                };
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
    pools: Vec<PoolExtracted>,
    users: Vec<UserExtracted>,
) -> Result<Response, ContractError> {
    verify_scheduler(&deps, &info)?;

    // update pools info
    for pool_received in pools {
        if POOLS
            .save(
                deps.storage,
                &pool_received.denom,
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
            return Err(ContractError::PoolIsNotUpdated {});
        };
    }

    // update users info
    for user_received in users {
        // validate address
        let osmo_address_received = deps.api.addr_validate(&user_received.osmo_address)?;

        // get user from storage by address
        let user_loaded = match USERS.load(deps.storage, &osmo_address_received) {
            Ok(x) => x,
            _ => {
                return Err(ContractError::UserIsNotFound {});
            }
        };

        // update user assets (wallet balances)
        let asset_list = user_loaded
            .asset_list
            .iter()
            .map(|asset_loaded| -> Result<Asset, ContractError> {
                // check if asset is in pool
                if POOLS.load(deps.storage, &asset_loaded.asset_denom).is_err() {
                    return Err(ContractError::AssetIsNotFound {});
                };

                // search same denom
                let asset_received = user_received
                    .asset_list
                    .iter()
                    .find(|&x| (x.asset_denom == asset_loaded.asset_denom))
                    .unwrap();

                Ok(Asset {
                    wallet_balance: asset_received.wallet_balance,
                    ..asset_loaded.to_owned()
                })
            })
            .collect::<Result<Vec<Asset>, ContractError>>()?;

        USERS.save(
            deps.storage,
            &osmo_address_received,
            &User {
                asset_list,
                ..user_loaded
            },
        )?;
    }

    Ok(Response::new().add_attributes(vec![("method", "update_pools_and_users")]))
}

pub fn swap(deps: DepsMut, env: Env, info: MessageInfo) -> Result<Response, ContractError> {
    verify_scheduler(&deps, &info)?;

    let pools = POOLS
        .range(deps.storage, None, None, Order::Ascending)
        .map(|x| x.unwrap())
        .collect();

    let users = USERS
        .range(deps.storage, None, None, Order::Ascending)
        .map(|x| x.unwrap())
        .collect();

    let (ledger, users_with_addresses) = get_ledger(&pools, &users);

    let mut msg_list = Vec::<CosmosMsg>::new();

    let config = CONFIG.load(deps.storage)?;
    let denom_token_in = &config.stablecoin_denom;

    for (i, global_denom) in ledger.global_denom_list.iter().enumerate() {
        // skip stablecoin
        if global_denom == denom_token_in {
            continue;
        }

        let token_out_min_amount = String::from("1");
        let amount = ledger.global_delta_cost_list[i];

        // skip if no funds
        if amount.is_zero() {
            continue;
        }

        let pool = POOLS.load(deps.storage, global_denom)?;

        // swap stablecoin to osmo anyway
        let mut routes: Vec<SwapAmountInRoute> = vec![SwapAmountInRoute {
            pool_id: config.stablecoin_pool_id,
            token_out_denom: "uosmo".to_string(),
        }];

        // if other asset is needed add extra route
        if global_denom != "uosmo" {
            routes.push(SwapAmountInRoute {
                pool_id: pool.id.u128() as u64,
                token_out_denom: global_denom.to_string(),
            });
        }

        let msg = MsgSwapExactAmountIn {
            sender: env.contract.address.to_string(),
            routes,
            token_in: Some(PoolCoin {
                amount: amount.to_string(),
                denom: denom_token_in.to_string(),
            }),
            token_out_min_amount,
        };

        msg_list.push(msg.into());
    }

    // update user list storage
    for (address, user_updated) in users_with_addresses {
        USERS.save(deps.storage, &address, &user_updated)?;
    }

    // update ledger
    LEDGER.save(deps.storage, &ledger)?;

    Ok(Response::new()
        .add_messages(msg_list)
        .add_attributes(vec![("method", "swap")]))
}

pub fn transfer(deps: DepsMut, env: Env, info: MessageInfo) -> Result<Response, ContractError> {
    verify_scheduler(&deps, &info)?;

    let pools: Vec<(String, Pool)> = POOLS
        .range(deps.storage, None, None, Order::Ascending)
        .map(|x| x.unwrap())
        .collect();

    let users: Vec<(Addr, User)> = USERS
        .range(deps.storage, None, None, Order::Ascending)
        .map(|x| x.unwrap())
        .collect();

    let ledger = LEDGER.load(deps.storage)?;

    let Config {
        stablecoin_denom,
        fee_default,
        fee_osmo,
        dapp_address_and_denom_list,
        timestamp,
        ..
    } = CONFIG.load(deps.storage)?;

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

    Ok(Response::new()
        .add_messages(msg_list)
        .add_attributes(vec![("method", "transfer")]))
}

// function for testing ibc transfers
pub fn multi_transfer(
    _deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    params: Vec<TransferParams>,
) -> Result<Response, ContractError> {
    let msg_list = params
        .iter()
        .map(|x| {
            CosmosMsg::Ibc(IbcMsg::Transfer {
                channel_id: x.channel_id.to_owned(),
                to_address: x.to.to_owned(),
                amount: coin(x.amount.u128(), x.denom.to_owned()),
                timeout: IbcTimeout::with_timestamp(x.timestamp),
            })
        })
        .collect::<Vec<CosmosMsg>>();

    Ok(Response::new()
        .add_messages(msg_list)
        .add_attributes(vec![("method", "multi_transfer")]))
}
