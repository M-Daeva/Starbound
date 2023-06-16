#[cfg(not(feature = "library"))]
use cosmwasm_std::{Decimal, DepsMut, MessageInfo, StdError, StdResult, Uint128};

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

// data verification for deposit method
pub fn verify_deposit_args(
    deps: &DepsMut,
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

        // TODO: enable proper verification after adding custom address generator
        // validate wallet address
        deps.api.addr_validate(&contract)?;
        // if !contract.starts_with(PREFIX) {
        //     Err(ContractError::InvalidAsset {})?;
        // }

        // let converted_address = get_addr_by_prefix(&contract, PREFIX)?;
        // deps.api.addr_validate(&converted_address)?;
    }

    Ok(())
}

// data verification for update_pools_and_users, swap, transfer methods
pub fn verify_scheduler(deps: &DepsMut, info: &MessageInfo) -> Result<(), ContractError> {
    let Config {
        admin, scheduler, ..
    } = CONFIG.load(deps.storage)?;

    if info.sender != admin && info.sender != scheduler {
        Err(ContractError::Unauthorized {})?;
    }

    Ok(())
}

// TODO: refactor tests
#[cfg(test)]
mod test {
    use cosmwasm_std::{coin, Addr, Uint128};

    use crate::{
        actions::helpers::math::str_to_dec,
        contract::execute,
        error::ContractError,
        messages::execute::ExecuteMsg,
        state::DENOM_STABLE,
        tests::helpers::{
            get_instance, ADDR_ADMIN, ADDR_ALICE, ADDR_INVALID, DENOM_NORIA, FUNDS_AMOUNT,
            IS_REBALANCING_USED,
        },
    };

    #[test]
    fn verify_funds() {
        // try to deposit regular asset instead of stable currency
        let funds_denom = DENOM_NORIA;
        let funds_amount = FUNDS_AMOUNT;
        let is_rebalancing_used = Some(IS_REBALANCING_USED);

        let (mut deps, env, mut info, _) = get_instance(ADDR_ADMIN);

        let asset_list_alice = vec![
            (ADDR_ALICE.to_string(), str_to_dec("0.5")),
            (ADDR_ALICE.to_string(), str_to_dec("0.5")),
        ];

        let msg = ExecuteMsg::Deposit {
            asset_list: Some(asset_list_alice),
            down_counter: Some(Uint128::from(3_u128)),
            is_rebalancing_used,
        };
        info.funds = vec![coin(funds_amount, funds_denom)];
        info.sender = Addr::unchecked(ADDR_ALICE);
        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

        assert_eq!(res.err(), Some(ContractError::UnexpectedFunds {}));

        // try to deposit with [0, 1.5] weights
        let funds_denom = DENOM_STABLE;

        let asset_list_alice = vec![
            (ADDR_ALICE.to_string(), str_to_dec("0")),
            (ADDR_ALICE.to_string(), str_to_dec("1.5")),
        ];

        let msg = ExecuteMsg::Deposit {
            asset_list: Some(asset_list_alice),
            down_counter: Some(Uint128::from(3_u128)),
            is_rebalancing_used,
        };
        info.funds = vec![coin(funds_amount, funds_denom)];
        info.sender = Addr::unchecked(ADDR_ALICE);
        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

        assert_eq!(res.err(), Some(ContractError::WeightIsOutOfRange {}));

        // try to deposit with [0.7, 0.5] weights
        let asset_list_alice = vec![
            (ADDR_ALICE.to_string(), str_to_dec("0.7")),
            (ADDR_ALICE.to_string(), str_to_dec("0.5")),
        ];

        let msg = ExecuteMsg::Deposit {
            asset_list: Some(asset_list_alice),
            down_counter: Some(Uint128::from(3_u128)),
            is_rebalancing_used,
        };
        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

        assert_eq!(res.err(), Some(ContractError::WeightsAreUnbalanced {}));

        // try to deposit with duplicated denoms
        let asset_list_alice = vec![
            (ADDR_ALICE.to_string(), str_to_dec("0.3")),
            (ADDR_ALICE.to_string(), str_to_dec("0.4")),
            (ADDR_ALICE.to_string(), str_to_dec("0.3")),
        ];

        let msg = ExecuteMsg::Deposit {
            asset_list: Some(asset_list_alice),
            down_counter: Some(Uint128::from(3_u128)),
            is_rebalancing_used,
        };
        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

        assert_eq!(res.err(), Some(ContractError::DuplicatedAssets {}));

        // try to deposit with wrong address
        let asset_list_alice = vec![
            (ADDR_INVALID.to_string(), str_to_dec("0.6")),
            (ADDR_ALICE.to_string(), str_to_dec("0.4")),
        ];

        let msg = ExecuteMsg::Deposit {
            asset_list: Some(asset_list_alice),
            down_counter: Some(Uint128::from(3_u128)),
            is_rebalancing_used,
        };
        info.sender = Addr::unchecked(ADDR_ALICE);
        let res = execute(deps.as_mut(), env, info, msg);

        // assert_eq!(res.err(), Some(ContractError::InvalidAsset {}));
        assert_eq!(res.err(), None);
    }
}
