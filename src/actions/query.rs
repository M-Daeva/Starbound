#[cfg(not(feature = "library"))]
use cosmwasm_std::{to_binary, Binary, Deps, Env, Order, StdResult};

use crate::{
    messages::response::{
        DebugQueryBank, DebugQueryPoolsAndUsers, QueryAssets, QueryPoolsAndUsers,
    },
    state::{PoolExtracted, User, UserExtracted, POOLS, STATE, USERS},
};

pub fn query_assets(deps: Deps, _env: Env, address: String) -> StdResult<Binary> {
    let address_validated = deps.api.addr_validate(&address)?;
    let user = USERS.load(deps.storage, &address_validated)?;

    to_binary(&QueryAssets {
        asset_list: user.asset_list,
    })
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

    to_binary(&QueryPoolsAndUsers { users, pools })
}

pub fn debug_query_pools_and_users(deps: Deps, _env: Env) -> StdResult<Binary> {
    let users = USERS
        .range(deps.storage, None, None, Order::Ascending)
        .map(|x| {
            let (_osmo_address, user) = x.unwrap();

            User {
                asset_list: user.asset_list,
                day_counter: user.day_counter,
                deposited_on_current_period: user.deposited_on_current_period,
                deposited_on_next_period: user.deposited_on_next_period,
                is_controlled_rebalancing: user.is_controlled_rebalancing,
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

    to_binary(&DebugQueryPoolsAndUsers { users, pools })
}

pub fn debug_query_bank(deps: Deps, env: Env) -> StdResult<Binary> {
    let state = STATE.load(deps.storage)?;

    to_binary(&DebugQueryBank {
        dapp_wallet: deps.querier.query_all_balances(env.contract.address)?,
        global_delta_balance_list: state.global_delta_balance_list,
        global_delta_cost_list: state.global_delta_cost_list,
        global_denom_list: state.global_denom_list,
        global_price_list: state.global_price_list,
    })
}
