#[cfg(not(feature = "library"))]
use cosmwasm_std::{entry_point, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult};

use crate::{
    actions::{
        execute::{deposit, swap, transfer, update_pools_and_users, update_scheduler, withdraw},
        instantiate::init,
        migrate::migrate_contract,
        query::{
            debug_query_bank, debug_query_pools_and_users, query_assets, query_pools_and_users,
        },
    },
    error::ContractError,
    messages::{
        execute::ExecuteMsg, instantiate::InstantiateMsg, migrate::MigrateMsg, query::QueryMsg,
    },
};

/// Creates a new contract with the specified parameters packed in the "msg" variable
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    init(deps, env, info, msg)
}

/// Exposes all the execute functions available in the contract
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::Deposit { user } => deposit(deps, env, info, user),
        ExecuteMsg::Withdraw { amount } => withdraw(deps, env, info, amount),
        ExecuteMsg::UpdateScheduler { address } => update_scheduler(deps, env, info, address),
        ExecuteMsg::UpdatePoolsAndUsers { pools, users } => {
            update_pools_and_users(deps, env, info, pools, users)
        }
        ExecuteMsg::Swap {} => swap(deps, env, info),
        ExecuteMsg::Transfer {} => transfer(deps, env, info),
    }
}

/// Exposes all the queries available in the contract
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::QueryAssets { address } => query_assets(deps, env, address),
        QueryMsg::QueryPoolsAndUsers {} => query_pools_and_users(deps, env),
        QueryMsg::DebugQueryPoolsAndUsers {} => debug_query_pools_and_users(deps, env),

        QueryMsg::DebugQueryBank {} => debug_query_bank(deps, env),
    }
}

/// Used for contract migration
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn migrate(deps: DepsMut, env: Env, msg: MigrateMsg) -> Result<Response, ContractError> {
    migrate_contract(deps, env, msg)
}

// /// The entry point to the contract for processing replies from submessages
// #[cfg_attr(not(feature = "library"), entry_point)]
// pub fn reply(deps: Deps, env: Env, msg: Reply) -> Result<Response, ContractError> {}
