#[cfg(not(feature = "library"))]
use cosmwasm_std::{Addr, Coin, Decimal, Deps, Env, Order, StdResult, Uint128};

use crate::{
    actions::helpers::math::get_xyk_price,
    messages::query::QueryBalancesResponse,
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
fn query_denom_price(_deps: Deps, _env: Env) -> StdResult<Decimal> {
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
        asset_decimals: [decimals1, decimals2],
        ..
    } in query_pairs_result
    {
        let query_pool_result: terraswap::pair::PoolResponse = deps
            .querier
            .query_wasm_smart(&contract_addr, &terraswap::pair::QueryMsg::Pool {})?;

        let terraswap::pair::PoolResponse {
            assets: [asset1, asset2],
            ..
        } = query_pool_result;

        // calculate prices of ucrd-asset pools
        let (denom_asset, unknown_asset, unknown_decimals) = if asset1.info.equal(&denom_asset_info)
        {
            (asset1, asset2, decimals2)
        } else if asset2.info.equal(&denom_asset_info) {
            (asset2, asset1, decimals1)
        } else {
            // store parameters of non ucrd-asset pools
            raw_info_list.push(([asset1, asset2], [decimals1, decimals2]));
            continue;
        };

        update_asset_data_list(
            &mut asset_data_list,
            denom_asset,
            denom_price,
            denom_decimals,
            unknown_asset,
            unknown_decimals,
        );
    }

    // calculate prices of non ucrd-asset pools
    for ([asset1, asset2], [decimals1, decimals2]) in raw_info_list {
        let (ref_asset, ref_price, ref_decimals, unknown_asset, unknown_decimals) =
            if let Some((_, price, _)) = asset_data_list
                .iter()
                .find(|(asset_info, ..)| asset1.info.equal(asset_info))
            {
                (asset1, *price, decimals1, asset2, decimals2)
            } else if let Some((_, price, _)) = asset_data_list
                .iter()
                .find(|(asset_info, ..)| asset2.info.equal(asset_info))
            {
                (asset2, *price, decimals2, asset1, decimals1)
            } else {
                continue;
            };

        update_asset_data_list(
            &mut asset_data_list,
            ref_asset,
            ref_price,
            ref_decimals,
            unknown_asset,
            unknown_decimals,
        );
    }

    Ok(asset_data_list)
}

fn update_asset_data_list(
    asset_data_list: &mut Vec<(terraswap::asset::AssetInfo, Decimal, u8)>,
    ref_asset: terraswap::asset::Asset,
    ref_price: Decimal,
    ref_decimals: u8,
    unknown_asset: terraswap::asset::Asset,
    unknown_decimals: u8,
) {
    let price = get_xyk_price(
        ref_price,
        ref_decimals,
        unknown_decimals,
        ref_asset.amount,
        unknown_asset.amount,
    );

    if !asset_data_list
        .iter()
        .any(|(asset_data, ..)| asset_data.equal(&unknown_asset.info))
    {
        asset_data_list.push((unknown_asset.info, price, unknown_decimals));
    }
}

pub fn query_balances(
    deps: Deps,
    env: Env,
    address_list: Vec<impl ToString>,
) -> StdResult<QueryBalancesResponse> {
    // get list of accounts saved in contract
    let address_list = address_list
        .iter()
        .map(|x| deps.api.addr_validate(&x.to_string()))
        .collect::<StdResult<Vec<Addr>>>()?;

    let account_list = USERS
        .range(deps.storage, None, None, Order::Ascending)
        .flatten()
        .filter(|(addr, _user)| address_list.is_empty() || address_list.contains(addr))
        .map(|(addr, _user)| addr)
        .collect::<Vec<Addr>>();

    // get lists of assets from dex
    let mut asset_list: Vec<terraswap::asset::AssetInfo> = vec![];

    for terraswap::asset::PairInfo { asset_infos, .. } in query_pairs(deps, env)? {
        for info in asset_infos {
            if !asset_list.contains(&info) {
                asset_list.push(info);
            }
        }
    }

    // split assets to coins and tokens
    let mut coin_list: Vec<String> = vec![];
    let mut token_list: Vec<Addr> = vec![];

    for asset in asset_list {
        match asset {
            terraswap::asset::AssetInfo::NativeToken { denom } => coin_list.push(denom),
            terraswap::asset::AssetInfo::Token { contract_addr } => {
                token_list.push(deps.api.addr_validate(&contract_addr)?)
            }
        };
    }

    let mut accounts_and_balances: Vec<(Addr, Vec<(terraswap::asset::AssetInfo, Uint128)>)> =
        vec![];

    for account in &account_list {
        // query account coins included in pairs
        let mut balances = deps
            .querier
            .query_all_balances(account)?
            .into_iter()
            .filter(|Coin { denom, amount }| coin_list.contains(denom) && !amount.is_zero())
            .map(|Coin { denom, amount }| {
                (terraswap::asset::AssetInfo::NativeToken { denom }, amount)
            })
            .collect::<Vec<(terraswap::asset::AssetInfo, Uint128)>>();

        // query account tokens included in pairs
        for token in &token_list {
            let cw20::BalanceResponse { balance } = deps.querier.query_wasm_smart(
                token,
                &cw20_base::msg::QueryMsg::Balance {
                    address: account.to_string(),
                },
            )?;

            if !balance.is_zero() {
                balances.push((
                    terraswap::asset::AssetInfo::Token {
                        contract_addr: token.to_string(),
                    },
                    balance,
                ));
            }
        }

        accounts_and_balances.push((account.to_owned(), balances));
    }

    Ok(accounts_and_balances)
}
