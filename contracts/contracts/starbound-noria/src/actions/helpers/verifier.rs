#[cfg(not(feature = "library"))]
use cosmwasm_std::{Addr, Decimal, Deps, MessageInfo, StdError, StdResult, Uint128};

use bech32::{decode, encode, Variant};

use crate::{
    error::ContractError,
    state::{Config, User, CONFIG, PREFIX},
};

// to convert any other chain address to current chain address and use it with deps.api.addr_validate
// because deps.api.addr_validate can not validate addresses from other networks
// https://testnet.mintscan.io/osmosis-testnet/txs/44709BCDFFAC51C1AB1245FB7AF31D14B3607357E18A57A569BD82E66DB12F06
pub fn get_addr_by_prefix(address: &str, prefix: &str) -> StdResult<String> {
    let (_hrp, data, _) = decode(address).map_err(|e| StdError::generic_err(e.to_string()))?;
    let new_address =
        encode(prefix, data, Variant::Bech32).map_err(|e| StdError::generic_err(e.to_string()))?;

    Ok(new_address)
}

fn verify_address(deps: &Deps, raw_address: impl ToString) -> Result<Addr, ContractError> {
    let address = &raw_address.to_string();

    if !address.starts_with(PREFIX) {
        Err(ContractError::InvalidAsset {})?;
    }

    let native_address = get_addr_by_prefix(&address, PREFIX)?;
    let verified_address = deps.api.addr_validate(&native_address)?;

    Ok(verified_address)
}

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
    if !(user_loaded == &User::default() && asset_list.is_some() && down_counter.is_some()) {
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

    // verify asset list
    for (contract, _weight) in asset_list.clone().unwrap_or_default() {
        // check if asset exists in pool list
        // if (denom != EXCHANGE_DENOM) && POOLS.load(deps.storage, denom).is_err() {
        //     Err(ContractError::AssetIsNotFound {})?;
        // };

        // verify wallet address
        // TODO: enable proper verification after adding custom address generator
        deps.api.addr_validate(&contract)?;
        // verify_address(deps, contract)?;
    }

    Ok(())
}
