#[cfg(not(feature = "library"))]
use cosmwasm_std::{Decimal, Deps, Env, MessageInfo, Uint128};

use crate::{
    actions::query::query_pairs,
    error::ContractError,
    state::{Config, User, CONFIG},
};

// data verification for update_pools_and_users, swap, transfer methods
pub fn verify_scheduler(deps: &Deps, info: &MessageInfo) -> Result<(), ContractError> {
    let Config {
        admin, scheduler, ..
    } = CONFIG.load(deps.storage)?;

    if info.sender != admin && info.sender != scheduler {
        Err(ContractError::Unauthorized {})?;
    }

    Ok(())
}

// data verification for deposit method
pub fn verify_deposit_args(
    deps: &Deps,
    env: &Env,
    info: &MessageInfo,
    asset_list: &Option<Vec<(String, Decimal)>>,
    _is_rebalancing_used: Option<bool>,
    down_counter: Option<Uint128>,
    denom_stable: &str,
    user_loaded: &User,
) -> Result<(), ContractError> {
    // only single stable currency payments are allowed
    if info.funds.len() > 1 || (info.funds.len() == 1 && info.funds[0].denom != denom_stable) {
        Err(ContractError::UnexpectedFunds {})?;
    }

    // skip checking assets and weight if we need just update down_counter or is_rebalancing_used
    if user_loaded != &User::default() && asset_list.is_none() {
        return Ok(());
    }

    // asset_list and down_counter are required if new user was created
    if user_loaded == &User::default() && !(asset_list.is_some() && down_counter.is_some()) {
        Err(ContractError::NewUserRequirements {})?;
    }

    // check if all weights are in range [0, 1]
    if asset_list
        .clone()
        .unwrap_or_default()
        .iter()
        .any(|(_contract, weight)| weight > &Decimal::one())
    {
        Err(ContractError::WeightIsOutOfRange {})?;
    }

    // check if sum of weights is equal one
    let weight_sum = asset_list.clone().map_or(Decimal::one(), |x| {
        x.iter()
            .fold(Decimal::zero(), |acc, (_contract, weight)| acc + weight)
    });

    if weight_sum != Decimal::one() {
        Err(ContractError::WeightsAreUnbalanced {})?;
    }

    // check if asset_list contains unique denoms
    let mut list = asset_list
        .clone()
        .unwrap_or_default()
        .iter()
        .map(|(contract, _weight)| contract.to_owned())
        .collect::<Vec<String>>();

    list.sort();
    list.dedup();

    if list.len() != asset_list.clone().unwrap_or_default().len() {
        Err(ContractError::DuplicatedAssets {})?;
    }

    // verify asset list - only asset from pair list can be added
    let asset_pair_list: Vec<[String; 2]> = query_pairs(deps.to_owned(), env.to_owned())?
        .into_iter()
        .map(|pair| {
            pair.asset_infos.map(|asset_info| match asset_info {
                terraswap::asset::AssetInfo::NativeToken { denom } => denom,
                terraswap::asset::AssetInfo::Token { contract_addr } => contract_addr,
            })
        })
        .collect();

    for (contract, _weight) in asset_list.clone().unwrap_or_default() {
        if !asset_pair_list
            .iter()
            .any(|[asset1, asset2]| &contract == asset1 || &contract == asset2)
        {
            Err(ContractError::AssetIsNotFound {})?;
        };
    }

    Ok(())
}
