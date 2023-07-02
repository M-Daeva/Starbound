#[cfg(not(feature = "library"))]
use cosmwasm_std::{
    coin, BankMsg, CosmosMsg, Decimal, DepsMut, Env, MessageInfo, Response, StdError, StdResult,
    Uint128,
};

use crate::{
    actions::{
        helpers::{
            math::get_ledger,
            routers::{get_swap_with_terraswap_router_config, transfer_router},
            verifier::{verify_deposit_args, verify_scheduler},
        },
        query::{query_assets_in_pools, query_balances, query_pairs, query_users},
    },
    error::ContractError,
    state::{Asset, Config, User, CONFIG, DENOM_STABLE, LEDGER, USERS},
};

pub fn deposit(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    asset_list: Option<Vec<(String, Decimal)>>,
    is_rebalancing_used: Option<bool>,
    down_counter: Option<Uint128>,
) -> Result<Response, ContractError> {
    // check if user exists or create new
    let user_loaded = USERS.load(deps.storage, &info.sender).unwrap_or_default();

    verify_deposit_args(
        &deps.as_ref(),
        &env,
        &info,
        &asset_list,
        down_counter,
        DENOM_STABLE,
        &user_loaded,
    )?;

    // received asset_list is empty just take it from user_loaded
    let asset_list: Vec<Asset> = asset_list.map_or(Ok(user_loaded.asset_list), |x| {
        x.iter()
            .map(|(asset_info, weight)| {
                Ok(Asset::new(
                    // assets were verified by verify_deposit_args()
                    asset_info,
                    weight.to_owned(),
                ))
            })
            .collect::<StdResult<Vec<Asset>>>()
    })?;

    let funds_amount = info
        .funds
        .iter()
        .find(|&x| x.denom == DENOM_STABLE)
        .map_or(Uint128::zero(), |x| x.amount);

    USERS.save(
        deps.storage,
        &info.sender,
        &User {
            asset_list,
            stable_balance: user_loaded.stable_balance + funds_amount,
            down_counter: down_counter.unwrap_or(user_loaded.down_counter),
            is_rebalancing_used: is_rebalancing_used.unwrap_or(user_loaded.is_rebalancing_used),
        },
    )?;

    Ok(Response::new().add_attributes(vec![
        ("action", "deposit"),
        ("user_deposited", &funds_amount.to_string()),
    ]))
}

pub fn withdraw(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    amount: Uint128,
) -> Result<Response, ContractError> {
    let user = USERS.update(
        deps.storage,
        &info.sender,
        |some_user| -> Result<User, ContractError> {
            let user = some_user.ok_or(ContractError::UserIsNotFound {})?;

            // check withdraw amount
            if amount > user.stable_balance {
                Err(ContractError::WithdrawAmountIsExceeded {})?;
            }

            Ok(User {
                stable_balance: user.stable_balance - amount,
                ..user
            })
        },
    )?;

    let msg = CosmosMsg::Bank(BankMsg::Send {
        to_address: info.sender.to_string(),
        amount: vec![coin(amount.u128(), DENOM_STABLE)],
    });

    Ok(Response::new().add_message(msg).add_attributes(vec![
        ("action", "withdraw"),
        ("user_stable_balance", &user.stable_balance.to_string()),
    ]))
}

pub fn update_config(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    scheduler: Option<String>,
    terraswap_factory: Option<String>,
    terraswap_router: Option<String>,
    fee_rate: Option<Decimal>,
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

            if let Some(x) = terraswap_factory {
                config.terraswap_factory = deps.api.addr_validate(&x)?;
            }

            if let Some(x) = terraswap_router {
                config.terraswap_router = deps.api.addr_validate(&x)?;
            }

            if let Some(x) = fee_rate {
                config.fee_rate = x;
            }

            Ok(config)
        },
    )?;

    Ok(Response::new().add_attributes(vec![("action", "update_config")]))
}

// pub fn swap(deps: DepsMut, env: Env, info: MessageInfo) -> Result<Response, ContractError> {
//     verify_scheduler(&deps.as_ref(), &info)?;

//     let pairs = query_pairs(deps.as_ref(), env)?;
//     let users_with_addresses = query_users(deps.as_ref(), env, vec![])?;
//     let asset_data_list = query_assets_in_pools(deps.as_ref(), env)?;
//     let balances_with_addresses = query_balances(deps.as_ref(), env, vec![])?;

//     let (ledger, users_with_addresses) = get_ledger(
//         &asset_data_list,
//         &users_with_addresses,
//         &balances_with_addresses,
//     );

//     let mut msg_list = Vec::<CosmosMsg>::new();

//     let config = CONFIG.load(deps.storage)?;
//     let denom_token_in = DENOM_STABLE;

//     for (i, global_denom) in ledger.global_denom_list.iter().enumerate() {
//         // skip stablecoin
//         if global_denom.to_string().contains(denom_token_in) {
//             continue;
//         }

//         let token_out_min_amount = String::from("1");
//         let amount = ledger.global_delta_cost_list[i];

//         // skip if no funds
//         if amount.is_zero() {
//             continue;
//         }

//         // let pool = POOLS.load(deps.storage, global_denom)?;

//         //let mut routes: Vec = vec![];

//         // if other asset is needed add extra route
//         if !global_denom.to_string().contains(DENOM_STABLE) {
//             routes.push(SwapAmountInRoute {
//                 pool_id: pool.id.u128() as u64,
//                 token_out_denom: global_denom.to_string(),
//             });
//         }

//         let msg = MsgSwapExactAmountIn {
//             sender: env.contract.address.to_string(),
//             routes,
//             token_in: Some(PoolCoin {
//                 amount: amount.to_string(),
//                 denom: denom_token_in.to_string(),
//             }),
//             token_out_min_amount,
//         };

//         msg_list.push(msg.into());
//     }

//     // update user list storage
//     for (address, user_updated) in users_with_addresses {
//         USERS.save(deps.storage, &address, &user_updated)?;
//     }

//     // update ledger
//     LEDGER.save(deps.storage, &ledger)?;

//     Ok(Response::new()
//         .add_messages(msg_list)
//         .add_attributes(vec![("action", "swap")]))
// }

// pub fn transfer(deps: DepsMut, env: Env, info: MessageInfo) -> Result<Response, ContractError> {
//     verify_scheduler(&deps.as_ref(), &info)?;

//     let QueryPoolsAndUsersResponse { pools, users } =
//         query_pools_and_users(deps.as_ref(), env.clone())?;

//     let ledger = LEDGER.load(deps.storage)?;

//     let Config {
//         stablecoin_denom,
//         fee_default,
//         fee_native,
//         dapp_address_and_denom_list,
//         ..
//     } = CONFIG.load(deps.storage)?;
//     let timestamp = env.block.time.plus_seconds(IBC_TIMEOUT_IN_MINS * 60);

//     let contract_balances = deps.querier.query_all_balances(env.contract.address)?;

//     let (users_updated, msg_list) = transfer_router(
//         &pools,
//         &users,
//         contract_balances,
//         ledger,
//         fee_default,
//         fee_native,
//         dapp_address_and_denom_list,
//         &stablecoin_denom,
//         timestamp,
//     );

//     // update users
//     for (address, user) in users_updated {
//         USERS.save(deps.storage, &address, &user)?;
//     }

//     CONFIG.update(deps.storage, |mut x| -> Result<Config, StdError> {
//         x.timestamp = timestamp;
//         Ok(x)
//     })?;

//     Ok(Response::new()
//         .add_messages(msg_list)
//         .add_attributes(vec![("action", "transfer")]))
// }
