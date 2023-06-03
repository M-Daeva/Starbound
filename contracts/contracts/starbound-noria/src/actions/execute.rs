#[cfg(not(feature = "library"))]
use cosmwasm_std::{Decimal, DepsMut, Env, MessageInfo, Response, StdResult, Uint128};

use crate::{
    actions::helpers::verifier::verify_deposit_args,
    error::ContractError,
    state::{Asset, User, DENOM_STABLE, USERS},
};

pub fn deposit(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    asset_list: Option<Vec<(String, Decimal)>>,
    is_rebalancing_used: Option<bool>,
    down_counter: Option<Uint128>,
) -> Result<Response, ContractError> {
    // check if user exists or create new
    let user_loaded = USERS.load(deps.storage, &info.sender).unwrap_or_default();

    verify_deposit_args(
        &deps,
        &info,
        &asset_list,
        is_rebalancing_used,
        down_counter,
        DENOM_STABLE,
        &user_loaded,
    )?;

    // received asset_list is empty just take it from user_loaded
    let asset_list: Vec<Asset> = asset_list.map_or(Ok(user_loaded.asset_list), |x| {
        x.iter()
            .map(|(contract, weight)| {
                Ok(Asset::new(
                    &deps.api.addr_validate(contract)?,
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
        ("method", "deposit"),
        ("user_deposited", &funds_amount.to_string()),
    ]))
}

// pub fn withdraw(
//     deps: DepsMut,
//     _env: Env,
//     info: MessageInfo,
//     amount: Uint128,
// ) -> Result<Response, ContractError> {
//     let config = CONFIG.load(deps.storage)?;
//     let denom_token_out = config.stablecoin_denom;

//     let user = USERS.update(
//         deps.storage,
//         &info.sender,
//         |some_user| -> Result<User, ContractError> {
//             let user = some_user.ok_or(ContractError::UserIsNotFound {})?;

//             // check withdraw amount
//             if amount > user.deposited {
//                 Err(ContractError::WithdrawAmountIsExceeded {})?;
//             }

//             Ok(User {
//                 deposited: user.deposited - amount,
//                 ..user
//             })
//         },
//     )?;

//     let msg = CosmosMsg::Bank(BankMsg::Send {
//         to_address: info.sender.to_string(),
//         amount: vec![coin(amount.u128(), denom_token_out)],
//     });

//     Ok(Response::new().add_message(msg).add_attributes(vec![
//         ("method", "withdraw"),
//         ("user_deposited", &user.deposited.to_string()),
//     ]))
// }

// #[allow(clippy::too_many_arguments)]
// pub fn update_config(
//     deps: DepsMut,
//     _env: Env,
//     info: MessageInfo,
//     scheduler: Option<AddrUnchecked>,
//     stablecoin_denom: Option<Denom>,
//     stablecoin_pool_id: Option<u64>,
//     fee_default: Option<Decimal>,
//     fee_native: Option<Decimal>,
//     dapp_address_and_denom_list: Option<Vec<(AddrUnchecked, Denom)>>,
// ) -> Result<Response, ContractError> {
//     CONFIG.update(
//         deps.storage,
//         |mut config| -> Result<Config, ContractError> {
//             if info.sender != config.admin {
//                 Err(ContractError::Unauthorized {})?;
//             }

//             if let Some(x) = scheduler {
//                 config.scheduler = deps.api.addr_validate(&x)?;
//             }

//             if let Some(x) = stablecoin_denom {
//                 // pool id must be updated same time as denom
//                 config.stablecoin_denom = x;
//                 config.stablecoin_pool_id =
//                     stablecoin_pool_id.ok_or(ContractError::StablePoolIdIsNotUpdated {})?;
//             }

//             if let Some(x) = fee_default {
//                 config.fee_default = x;
//             }

//             if let Some(x) = fee_native {
//                 config.fee_native = x;
//             }

//             if let Some(x) = dapp_address_and_denom_list {
//                 let mut verified_list: Vec<(Addr, String)> = vec![];

//                 for (address, denom) in x {
//                     verified_list.push((
//                         deps.api
//                             .addr_validate(&get_addr_by_prefix(&address, EXCHANGE_PREFIX)?)?,
//                         denom,
//                     ));
//                 }

//                 config.dapp_address_and_denom_list = verified_list;
//             }

//             Ok(config)
//         },
//     )?;

//     Ok(Response::new().add_attributes(vec![("method", "update_config")]))
// }

// pub fn swap(deps: DepsMut, _env: Env, info: MessageInfo) -> Result<Response, ContractError> {
//     verify_scheduler(&deps, &info)?;

//     Ok(Response::new().add_attributes(vec![("method", "swap")]))
// }

// pub fn transfer(deps: DepsMut, env: Env, info: MessageInfo) -> Result<Response, ContractError> {
//     verify_scheduler(&deps, &info)?;

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
//         .add_attributes(vec![("method", "transfer")]))
// }
