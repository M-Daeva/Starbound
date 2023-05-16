#[cfg(not(feature = "library"))]
use cosmwasm_std::{to_binary, Binary, Deps, Env, Order, StdResult};

use crate::{
    messages::query::{
        QueryConfigResponse, QueryLedgerResponse, QueryPoolsAndUsersResponse, QueryUserResponse,
    },
    state::{Pool, PoolExtracted, UserExtracted, CONFIG, LEDGER, POOLS, USERS},
};

pub fn query_user(deps: Deps, _env: Env, address: String) -> StdResult<Binary> {
    let address_validated = deps.api.addr_validate(&address)?;
    let user = USERS.load(deps.storage, &address_validated)?;

    to_binary(&QueryUserResponse { user })
}

pub fn query_pools_and_users(deps: Deps, _env: Env) -> StdResult<Binary> {
    let users = USERS
        .range(deps.storage, None, None, Order::Ascending)
        .map(|x| {
            let (osmo_address, user) = x.unwrap();
            let asset_list = user.asset_list.iter().map(|x| x.extract()).collect();

            UserExtracted {
                osmo_address: osmo_address.to_string(),
                asset_list,
            }
        })
        .collect();

    let pools = POOLS
        .range(deps.storage, None, None, Order::Ascending)
        .map(|x| {
            let (denom, pool) = x.unwrap();
            let Pool {
                channel_id,
                id,
                port_id,
                price,
                symbol,
            } = pool;

            PoolExtracted {
                denom,
                channel_id,
                id,
                port_id,
                price,
                symbol,
            }
        })
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
