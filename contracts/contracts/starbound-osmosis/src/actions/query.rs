#[cfg(not(feature = "library"))]
use cosmwasm_std::{Deps, Env, Order, StdResult};

use crate::{
    messages::query::{
        QueryConfigResponse, QueryLedgerResponse, QueryPoolsAndUsersResponse, QueryUserResponse,
    },
    state::{AddrUnchecked, CONFIG, LEDGER, POOLS, USERS},
};

pub fn query_user(deps: Deps, _env: Env, address: AddrUnchecked) -> StdResult<QueryUserResponse> {
    let address_validated = deps.api.addr_validate(&address)?;
    let user = USERS.load(deps.storage, &address_validated)?;

    Ok(QueryUserResponse { user })
}

pub fn query_pools_and_users(deps: Deps, _env: Env) -> StdResult<QueryPoolsAndUsersResponse> {
    let users = USERS
        .range(deps.storage, None, None, Order::Ascending)
        .map(|x| x.unwrap())
        .collect();

    let pools = POOLS
        .range(deps.storage, None, None, Order::Ascending)
        .map(|x| x.unwrap())
        .collect();

    Ok(QueryPoolsAndUsersResponse { users, pools })
}

pub fn query_ledger(deps: Deps, _env: Env) -> StdResult<QueryLedgerResponse> {
    Ok(QueryLedgerResponse {
        ledger: LEDGER.load(deps.storage)?,
    })
}

pub fn query_config(deps: Deps, _env: Env) -> StdResult<QueryConfigResponse> {
    Ok(QueryConfigResponse {
        config: CONFIG.load(deps.storage)?,
    })
}
