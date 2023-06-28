#[cfg(not(feature = "library"))]
use cosmwasm_std::{Addr, Decimal, Deps, Env, Order, StdResult, Uint128};

use crate::{
    actions::helpers::math::get_xyk_price,
    state::{Config, User, CONFIG, DENOM_STABLE, USERS},
};

pub fn query_config(deps: Deps, _env: Env) -> StdResult<Config> {
    CONFIG.load(deps.storage)
}

/// returns list of (address, user) for specified list of addresses
/// or full list of (address, user) if list of addresses is empty
pub fn query_users(
    deps: Deps,
    _env: Env,
    address_list: Vec<impl ToString>,
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
pub fn query_denom_price(_deps: Deps, _env: Env) -> StdResult<Decimal> {
    Ok(Decimal::one())
}

pub fn query_assets_in_pools(
    deps: Deps,
    env: Env,
) -> StdResult<Vec<(terraswap::asset::AssetInfo, Decimal, u8)>> {
    let denom_decimals: u8 = 6;
    let denom_asset_info = terraswap::asset::AssetInfo::NativeToken {
        denom: DENOM_STABLE.to_string(),
    };
    let denom_price = query_denom_price(deps, env.clone())?;

    let query_pairs_result = query_pairs(deps, env)?;

    // list of (asset_info, price, decimals)
    let mut asset_data_list: Vec<(terraswap::asset::AssetInfo, Decimal, u8)> =
        vec![(denom_asset_info.clone(), denom_price, denom_decimals)];
    // list of pairs without main asset
    let mut raw_info_list: Vec<([terraswap::asset::Asset; 2], [u8; 2])> = vec![];

    for terraswap::asset::PairInfo {
        contract_addr,
        asset_decimals,
        ..
    } in query_pairs_result
    {
        let query_pool_result: terraswap::pair::PoolResponse = deps
            .querier
            .query_wasm_smart(&contract_addr, &terraswap::pair::QueryMsg::Pool {})?;

        let terraswap::pair::PoolResponse { assets, .. } = query_pool_result;

        // calculate prices of ucrd-asset pools
        for i in 0..=1 {
            update_asset_data_list(
                &mut asset_data_list,
                &assets[i].info,
                assets.clone(),
                asset_decimals,
                denom_price,
                i,
            );
        }

        // store parameters of non ucrd-asset pools
        if !assets.iter().any(|x| x.info.equal(&denom_asset_info)) {
            raw_info_list.push((assets, asset_decimals));
        }
    }

    // calculate prices of non ucrd-asset pools
    for (assets, decimals) in raw_info_list {
        for (asset_data, price, _) in asset_data_list.clone().iter() {
            for i in 0..=1 {
                update_asset_data_list(
                    &mut asset_data_list,
                    asset_data,
                    assets.clone(),
                    decimals,
                    *price,
                    i,
                );
            }
        }
    }

    Ok(asset_data_list)
}

fn update_asset_data_list(
    asset_data_list: &mut Vec<(terraswap::asset::AssetInfo, Decimal, u8)>,
    current_asset_info: &terraswap::asset::AssetInfo,
    assets: [terraswap::asset::Asset; 2],
    decimals: [u8; 2],
    current_price: Decimal,
    i: usize,
) {
    if current_asset_info.equal(&assets[i].info) {
        let price = get_xyk_price(
            current_price,
            decimals[i],
            decimals[1 - i],
            assets[i].amount,
            assets[1 - i].amount,
        );

        let asset_info = &assets[1 - i].info;

        if !asset_data_list
            .iter()
            .any(|(asset_data, ..)| asset_data.equal(asset_info))
        {
            asset_data_list.push((asset_info.to_owned(), price, decimals[1 - i]));
        }
    }
}

// returns balances_with_addresses: Vec<(Addr, Vec<(terraswap::asset::AssetInfo, Uint128)>)>
pub fn query_balances(
    deps: Deps,
    _env: Env,
    address_list: Vec<impl ToString>,
) -> StdResult<Vec<(Addr, Vec<(terraswap::asset::AssetInfo, Uint128)>)>> {
    unimplemented!()
}
