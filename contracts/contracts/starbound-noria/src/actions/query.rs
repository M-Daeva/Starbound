#[cfg(not(feature = "library"))]
use cosmwasm_std::{Addr, Deps, Env, Order, StdResult};

use terraswap::{
    asset::PairInfo,
    factory::{PairsResponse, QueryMsg as FactoryQueryMsg},
};

use crate::state::{Config, User, CONFIG, DEX_FACTORY, USERS};

pub fn query_config(deps: Deps, _env: Env) -> StdResult<Config> {
    CONFIG.load(deps.storage)
}

/// returns list of (address, user) for specified list of addresses
/// or full list of (address, user) if list of addresses is empty
pub fn query_users<T: ToString>(
    deps: Deps,
    _env: Env,
    address_list: Vec<T>,
) -> StdResult<Vec<(Addr, User)>> {
    let address_list = address_list
        .iter()
        .map(|x| deps.api.addr_validate(&x.to_string()))
        .collect::<StdResult<Vec<Addr>>>()?;

    let res = USERS
        .range(deps.storage, None, None, Order::Ascending)
        .flatten()
        .filter(|(addr, _user)| address_list.is_empty() || address_list.contains(addr))
        .collect();

    Ok(res)
}

pub fn query_pairs(deps: Deps, _env: Env) -> StdResult<Vec<PairInfo>> {
    let PairsResponse { pairs } = deps.querier.query_wasm_smart(
        DEX_FACTORY,
        &FactoryQueryMsg::Pairs {
            start_after: None,
            limit: None,
        },
    )?;

    Ok(pairs)
}