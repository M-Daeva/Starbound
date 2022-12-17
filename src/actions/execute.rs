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
        rebalancer::{dec_to_u128, get_ledger, u128_to_dec},
        verifier::{verify_deposit_data, verify_scheduler},
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

pub fn update_config(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    scheduler: Option<String>,
    stablecoin_denom: Option<String>,
    stablecoin_pool_id: Option<u64>,
    fee_default: Option<Decimal>,
    fee_osmo: Option<Decimal>,
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

// TODO: fee collector
// TODO: osmo handler
pub fn transfer(deps: DepsMut, env: Env, info: MessageInfo) -> Result<Response, ContractError> {
    verify_scheduler(&deps, &info)?;

    // get contract balances
    let mut contract_balances = deps.querier.query_all_balances(env.contract.address)?;
    let ledger = LEDGER.load(deps.storage)?;
    let global_vec_len = ledger.global_denom_list.len();

    // vector of coins amount on contract address for all denoms
    let mut contract_assets: Vec<u128> = vec![0; global_vec_len];

    // vector of coins planned to send on all users adresses for all denoms
    let mut users_assets: Vec<u128> = vec![0; global_vec_len];

    // vector of correction ratios for users coins planned to send
    let mut correction_ratios: Vec<Decimal> = vec![];

    let mut user_list_updated: Vec<(Addr, User)> = USERS
        .range(deps.storage, None, None, Order::Ascending)
        .map(|x| x.unwrap())
        .collect();

    // update contract_assets
    for (i, global_denom) in ledger.global_denom_list.iter().enumerate() {
        let balance_by_denom = match &contract_balances.iter().find(|x| &x.denom == global_denom) {
            Some(y) => y.amount.u128(),
            None => 0,
        };
        contract_assets[i] = balance_by_denom;

        // update users_assets
        user_list_updated.iter().for_each(|(_osmo_address, user)| {
            for user_asset in &user.asset_list {
                if &user_asset.asset_denom == global_denom {
                    users_assets[i] += user_asset.amount_to_send_until_next_epoch.u128();
                }
            }
        });
    }

    // fill correction_ratios
    for (i, item) in contract_assets.iter().enumerate() {
        let res = if *item == 0 || users_assets[i] == 0 {
            Decimal::zero()
        } else {
            u128_to_dec(*item)
                .checked_div(u128_to_dec(users_assets[i]))
                .unwrap()
        };
        correction_ratios.push(res);
    }

    let mut msg_list = Vec::<CosmosMsg>::new();

    // correct users coins planned to send
    user_list_updated = user_list_updated
        .iter()
        .map(|(osmo_address, user)| {
            let mut user_updated = user.clone();
            let mut asset_list_updated = Vec::<Asset>::new();

            for user_asset in &user.asset_list {
                let index = ledger
                    .global_denom_list
                    .iter()
                    .position(|x| x == &user_asset.asset_denom)
                    .unwrap();

                let ratio = correction_ratios[index];
                let amount = u128_to_dec(user_asset.amount_to_send_until_next_epoch.u128());
                let mut amount_to_send_until_next_epoch = dec_to_u128(amount.mul(ratio));

                // correct sendable funds
                contract_balances = contract_balances
                    .iter()
                    .map(|x| {
                        if x.denom == user_asset.asset_denom {
                            if amount_to_send_until_next_epoch > x.amount.u128() {
                                amount_to_send_until_next_epoch = x.amount.u128();

                                coin(0, x.denom.clone())
                            } else {
                                coin(
                                    x.amount.u128() - amount_to_send_until_next_epoch,
                                    x.denom.clone(),
                                )
                            }
                        } else {
                            x.to_owned()
                        }
                    })
                    .collect();

                // skip if no funds
                if amount_to_send_until_next_epoch != 0 {
                    // execute ibc transfer
                    let block = IbcTimeoutBlock {
                        revision: 5,
                        height: 2000000,
                    };
                    let pool = POOLS.load(deps.storage, &user_asset.asset_denom).unwrap();

                    let msg = CosmosMsg::Ibc(IbcMsg::Transfer {
                        channel_id: pool.channel_id,
                        to_address: user_asset.wallet_address.to_string(),
                        amount: coin(amount_to_send_until_next_epoch, &user_asset.asset_denom),
                        timeout: IbcTimeout::with_block(block),
                    });

                    msg_list.push(msg);
                }

                // fill asset_list_updated
                let mut asset_updated = user_asset.clone();

                asset_updated.amount_to_send_until_next_epoch = Uint128::zero();
                asset_list_updated.push(asset_updated);
            }
            user_updated.asset_list = asset_list_updated;

            (osmo_address.to_owned(), user_updated)
        })
        .collect();

    // update user list
    for (address, user_updated) in user_list_updated {
        USERS.save(deps.storage, &address, &user_updated)?;
    }

    // update ledger
    LEDGER.update(deps.storage, |mut x| -> Result<_, ContractError> {
        x.global_delta_balance_list = vec![];
        x.global_delta_cost_list = vec![];
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
    let msg_list = params
        .iter()
        .map(|x| {
            CosmosMsg::Ibc(IbcMsg::Transfer {
                channel_id: x.channel_id.to_owned(),
                to_address: x.to.to_owned(),
                amount: coin(x.amount.u128(), x.denom.to_owned()),
                timeout: env.block.time.plus_seconds(300).into(),
            })
        })
        .collect::<Vec<CosmosMsg>>();

    Ok(Response::new()
        .add_messages(msg_list)
        .add_attributes(vec![("method", "multi_transfer")]))
}
