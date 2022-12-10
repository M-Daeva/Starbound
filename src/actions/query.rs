#[cfg(not(feature = "library"))]
use cosmwasm_std::{to_binary, Binary, Deps, Env, Order, StdResult};

use crate::{
    messages::response::{QueryPoolsAndUsersResponse, QueryUserResponse},
    state::{PoolExtracted, UserExtracted, POOLS, USERS},
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

            PoolExtracted {
                channel_id: pool.channel_id,
                denom,
                id: pool.id,
                port_id: pool.port_id,
                price: pool.price,
                symbol: pool.symbol,
            }
        })
        .collect();

    to_binary(&QueryPoolsAndUsersResponse { users, pools })
}
