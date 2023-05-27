#[cfg(not(feature = "library"))]
use cosmwasm_std::{Deps, Env, Order, StdResult};

use crate::{
    messages::query::QueryPoolsAndUsersResponse,
    state::{AddrUnchecked, Config, Ledger, User, CONFIG, LEDGER, POOLS, USERS},
};

pub fn query_config(deps: Deps, _env: Env) -> StdResult<Config> {
    CONFIG.load(deps.storage)
}

pub fn query_ledger(deps: Deps, _env: Env) -> StdResult<Ledger> {
    LEDGER.load(deps.storage)
}

pub fn query_user(deps: Deps, _env: Env, address: AddrUnchecked) -> StdResult<User> {
    let address_validated = deps.api.addr_validate(&address)?;
    USERS.load(deps.storage, &address_validated)
}

pub fn query_pools_and_users(deps: Deps, _env: Env) -> StdResult<QueryPoolsAndUsersResponse> {
    let users = USERS
        .range(deps.storage, None, None, Order::Ascending)
        .collect::<StdResult<Vec<_>>>()?;

    let pools = POOLS
        .range(deps.storage, None, None, Order::Ascending)
        .collect::<StdResult<Vec<_>>>()?;

    Ok(QueryPoolsAndUsersResponse { users, pools })
}
