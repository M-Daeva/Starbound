#[cfg(not(feature = "library"))]
use cosmwasm_std::{entry_point, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult};

use crate::{
    actions::{
        execute::{
            deposit, multi_transfer, swap, transfer, update_config, update_pools_and_users,
            withdraw,
        },
        instantiate::init,
        migrate::migrate_contract,
        query::{query_config, query_ledger, query_pools_and_users, query_user},
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
        ExecuteMsg::UpdateConfig {
            scheduler,
            stablecoin_denom,
            stablecoin_pool_id,
            fee_default,
            fee_osmo,
            dapp_address_and_denom_list,
        } => update_config(
            deps,
            env,
            info,
            scheduler,
            stablecoin_denom,
            stablecoin_pool_id,
            fee_default,
            fee_osmo,
            dapp_address_and_denom_list,
        ),
        ExecuteMsg::UpdatePoolsAndUsers { pools, users } => {
            update_pools_and_users(deps, env, info, pools, users)
        }
        ExecuteMsg::Swap {} => swap(deps, env, info),
        ExecuteMsg::Transfer {} => transfer(deps, env, info),
        ExecuteMsg::MultiTransfer { params } => multi_transfer(deps, env, info, params),
    }
}

/// Exposes all the queries available in the contract
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::QueryUser { address } => query_user(deps, env, address),
        QueryMsg::QueryPoolsAndUsers {} => query_pools_and_users(deps, env),
        QueryMsg::QueryLedger {} => query_ledger(deps, env),
        QueryMsg::QueryConfig {} => query_config(deps, env),
    }
}

/// Used for contract migration
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn migrate(deps: DepsMut, env: Env, msg: MigrateMsg) -> Result<Response, ContractError> {
    migrate_contract(deps, env, msg)
}
