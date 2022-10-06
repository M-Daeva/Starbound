#[cfg(not(feature = "library"))]
use cosmwasm_std::{to_binary, Binary, Deps, Env, Order, StdResult};

use crate::{
    messages::response::{
        GetAllDenomsResponse, GetAllPoolsResponse, GetDenomResponse, GetUserInfoResponse,
    },
    state::{AssetInfo, ASSET_DENOMS, STATE, USERS},
};

pub fn get_denom(deps: Deps, _env: Env, asset_symbol: String) -> StdResult<Binary> {
    let denom = ASSET_DENOMS.load(deps.storage, asset_symbol)?;

    to_binary(&GetDenomResponse { denom })
}

pub fn get_all_denoms(deps: Deps, _env: Env) -> StdResult<Binary> {
    let all_assets_info = ASSET_DENOMS
        .range(deps.storage, None, None, Order::Ascending)
        .fold(Vec::<AssetInfo>::new(), |mut acc, cur| {
            let (asset_symbol, asset_denom) = cur.unwrap();
            acc.push(AssetInfo {
                asset_symbol,
                asset_denom,
                price: 0, // TODO: add quering price
            });
            acc
        });

    to_binary(&GetAllDenomsResponse { all_assets_info })
}

pub fn get_all_pools(deps: Deps, _env: Env) -> StdResult<Binary> {
    let all_pools = STATE.load(deps.storage)?.pool_list;

    to_binary(&GetAllPoolsResponse { all_pools })
}

pub fn get_user_info(deps: Deps, _env: Env, address: String) -> StdResult<Binary> {
    let address_validated = deps.api.addr_validate(&address)?;
    let user = USERS.load(deps.storage, address_validated)?;

    to_binary(&GetUserInfoResponse {
        asset_list: user.asset_list,
        deposited_on_current_period: user.deposited_on_current_period,
        deposited_on_next_period: user.deposited_on_next_period,
        block_counter: user.block_counter,
        is_controlled_rebalancing: user.is_controlled_rebalancing,
        osmo_address: user.osmo_address,
    })
}
