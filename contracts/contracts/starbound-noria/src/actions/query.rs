#[cfg(not(feature = "library"))]
use cosmwasm_std::{Addr, Deps, Env, Order, StdResult, Uint128};

use crate::state::{Config, User, CONFIG, USERS};

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

pub fn query_pairs(deps: Deps, _env: Env) -> StdResult<Vec<terraswap::asset::PairInfo>> {
    let terraswap::factory::PairsResponse { pairs } = deps.querier.query_wasm_smart(
        CONFIG.load(deps.storage)?.terraswap_factory,
        &terraswap::factory::QueryMsg::Pairs {
            start_after: None,
            limit: None,
        },
    )?;

    Ok(pairs)
}

// TODO: implement when oracle module will be added
pub fn query_denom_price(_deps: Deps, _env: Env) -> StdResult<Uint128> {
    Ok(Uint128::one())
}

pub fn query_prices(deps: Deps, _env: Env) -> StdResult<()> {
    const POOL_NUMBER: usize = 2;

    let denom_price = Uint128::one();
    let terraswap_factory = CONFIG.load(deps.storage)?.terraswap_factory;

    let terraswap::factory::PairsResponse {
        pairs: query_pairs_result,
    } = deps.querier.query_wasm_smart(
        &terraswap_factory,
        &terraswap::factory::QueryMsg::Pairs {
            start_after: None,
            limit: None,
        },
    )?;
    println!("{:#?}", &query_pairs_result);

    let query_pair_result: terraswap::asset::PairInfo = deps.querier.query_wasm_smart(
        &terraswap_factory,
        &terraswap::factory::QueryMsg::Pair {
            asset_infos: query_pairs_result[POOL_NUMBER].asset_infos.clone(),
        },
    )?;
    println!("{:#?}", query_pair_result);

    let query_pair_info: terraswap::asset::PairInfo = deps.querier.query_wasm_smart(
        &query_pairs_result[POOL_NUMBER].contract_addr,
        &terraswap::pair::QueryMsg::Pair {},
    )?;
    println!("{:#?}", query_pair_info);

    let query_pool_result: terraswap::pair::PoolResponse = deps.querier.query_wasm_smart(
        &query_pairs_result[POOL_NUMBER].contract_addr,
        &terraswap::pair::QueryMsg::Pool {},
    )?;
    println!("{:#?}", query_pool_result);

    Ok(())
}
