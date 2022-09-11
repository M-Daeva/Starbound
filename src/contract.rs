#[cfg(not(feature = "library"))]
use cosmwasm_std::{entry_point, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult};

use crate::{
    actions::{
        execute::{deposit, swap_tokens},
        instantiate::init,
        migrate::migrate_contract,
        query::{get_all_denoms, get_all_pools, get_bank_balance, get_denom, get_user_info},
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
        ExecuteMsg::Deposit {} => deposit(deps, env, info),
        ExecuteMsg::SwapTokens { from, to, amount } => {
            swap_tokens(deps, env, info, from, to, amount)
        }
    }
}

/// Exposes all the queries available in the contract
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetDenom { asset_symbol } => get_denom(deps, env, asset_symbol),
        QueryMsg::GetAllDenoms {} => get_all_denoms(deps, env),
        QueryMsg::GetAllPools {} => get_all_pools(deps, env),
        QueryMsg::GetBankBalance {} => get_bank_balance(deps, env),
        QueryMsg::GetUserInfo { address } => get_user_info(deps, env, address),
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
