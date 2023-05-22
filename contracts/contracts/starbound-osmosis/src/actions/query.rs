#[cfg(not(feature = "library"))]
use cosmwasm_std::{to_binary, Binary, Deps, Env, Order, StdResult};

use crate::{
    messages::query::{
        QueryConfigResponse, QueryLedgerResponse, QueryPoolsAndUsersResponse, QueryUserResponse,
    },
    state::{AddrUnchecked, CONFIG, LEDGER, POOLS, USERS},
};

pub fn query_user(deps: Deps, _env: Env, address: AddrUnchecked) -> StdResult<Binary> {
    let address_validated = deps.api.addr_validate(&address)?;
    let user = USERS.load(deps.storage, &address_validated)?;

    to_binary(&QueryUserResponse { user })
}

pub fn query_pools_and_users(deps: Deps, _env: Env) -> StdResult<Binary> {
    let users = USERS
        .range(deps.storage, None, None, Order::Ascending)
        .map(|x| x.unwrap())
        .collect();

    let pools = POOLS
        .range(deps.storage, None, None, Order::Ascending)
        .map(|x| x.unwrap())
        .collect();

    to_binary(&QueryPoolsAndUsersResponse { users, pools })
}

pub fn query_ledger(deps: Deps, _env: Env) -> StdResult<Binary> {
    to_binary(&QueryLedgerResponse {
        ledger: LEDGER.load(deps.storage)?,
    })
}

pub fn query_config(deps: Deps, _env: Env) -> StdResult<Binary> {
    to_binary(&QueryConfigResponse {
        config: CONFIG.load(deps.storage)?,
    })
}
