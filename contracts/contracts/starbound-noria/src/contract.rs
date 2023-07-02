#[cfg(not(feature = "library"))]
use cosmwasm_std::{
    entry_point, to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult,
};

use crate::{
    actions::{
        execute::{deposit, swap, update_config, withdraw},
        instantiate::init,
        other::migrate_contract,
        query::{query_assets_in_pools, query_balances, query_config, query_pairs, query_users},
    },
    error::ContractError,
    messages::{
        execute::ExecuteMsg, instantiate::InstantiateMsg, other::MigrateMsg, query::QueryMsg,
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
        ExecuteMsg::Deposit {
            asset_list,
            is_rebalancing_used,
            down_counter,
        } => deposit(
            deps,
            env,
            info,
            asset_list,
            is_rebalancing_used,
            down_counter,
        ),
        ExecuteMsg::Withdraw { amount } => withdraw(deps, env, info, amount),
        ExecuteMsg::UpdateConfig {
            scheduler,
            terraswap_factory,
            terraswap_router,
            fee_rate,
        } => update_config(
            deps,
            env,
            info,
            scheduler,
            terraswap_factory,
            terraswap_router,
            fee_rate,
        ),
        ExecuteMsg::Swap {} => swap(deps, env, info),
        // ExecuteMsg::Transfer {} => transfer(deps, env, info),
    }
}

/// Exposes all the queries available in the contract
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::QueryUsers { address_list } => to_binary(&query_users(deps, env, address_list)?),
        QueryMsg::QueryConfig {} => to_binary(&query_config(deps, env)?),
        QueryMsg::QueryPairs {} => to_binary(&query_pairs(deps, env)?),
        QueryMsg::QueryAssetsInPools {} => to_binary(&query_assets_in_pools(deps, env)?),
        QueryMsg::QueryBalances { address_list } => {
            to_binary(&query_balances(deps, env, address_list)?)
        }
    }
}

/// Used for contract migration
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn migrate(deps: DepsMut, env: Env, msg: MigrateMsg) -> Result<Response, ContractError> {
    migrate_contract(deps, env, msg)
}
