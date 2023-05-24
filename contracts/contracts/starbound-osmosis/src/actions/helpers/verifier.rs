#[cfg(not(feature = "library"))]
use cosmwasm_std::{Decimal, DepsMut, MessageInfo, StdError, StdResult, Uint128};

use bech32::{decode, encode, Variant};

use crate::{
    error::ContractError,
    state::{Asset, CONFIG, EXCHANGE_PREFIX, POOLS, USERS},
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
pub fn verify_deposit_data(
    deps: &DepsMut,
    info: &MessageInfo,
    asset_list: &Vec<Asset>,
    _is_rebalancing_used: bool,
    _day_counter: Uint128,
) -> Result<(), ContractError> {
    // check funds
    let config = CONFIG.load(deps.storage)?;
    let denom_token_in = config.stablecoin_denom;

    // only single stablecoin payments are allowed
    if info.funds.len() > 1 || (info.funds.len() == 1 && info.funds[0].denom != denom_token_in) {
        return Err(ContractError::UnexpectedFunds {});
    }

    // skip checking assets and weight if we need just add funds and update day counter
    if asset_list.is_empty() && USERS.load(deps.storage, &info.sender).is_ok() {
        return Ok(());
    }

    // check if all weights are in range [0, 1]
    if asset_list
        .iter()
        .any(|asset| asset.weight.lt(&Decimal::zero()) || asset.weight.gt(&Decimal::one()))
    {
        return Err(ContractError::WeightIsOutOfRange {});
    }

    // check if sum of weights is equal one
    let weight_sum = asset_list
        .iter()
        .fold(Decimal::zero(), |acc, cur| acc + cur.weight);

    if weight_sum.ne(&Decimal::one()) {
        return Err(ContractError::WeightsAreUnbalanced {});
    }

    // check if asset_list contains unique denoms
    let mut list = asset_list
        .iter()
        .map(|x| x.asset_denom.clone())
        .collect::<Vec<String>>();

    list.sort();
    list.dedup();

    if list.len() != asset_list.len() {
        return Err(ContractError::DuplicatedAssets {});
    }

    // verify asset list
    for asset in asset_list {
        // check if asset exists in pool list
        if (asset.asset_denom != "uosmo") && POOLS.load(deps.storage, &asset.asset_denom).is_err() {
            return Err(ContractError::AssetIsNotFound {});
        };

        // validate wallet address
        deps.api.addr_validate(&get_addr_by_prefix(
            asset.wallet_address.as_str(),
            EXCHANGE_PREFIX,
        )?)?;
    }

    Ok(())
}

// data verification for update_pools_and_users, swap, transfer methods
pub fn verify_scheduler(deps: &DepsMut, info: &MessageInfo) -> Result<(), ContractError> {
    // check if sender is scheduler
    let config = CONFIG.load(deps.storage)?;

    if info.sender != config.admin && info.sender != config.scheduler {
        return Err(ContractError::Unauthorized {});
    }

    Ok(())
}

// TODO: refactor tests
#[cfg(test)]
mod test {
    use cosmwasm_std::{coin, Addr, StdError::GenericErr, Uint128};

    use crate::{
        actions::helpers::math::str_to_dec,
        contract::execute,
        error::{ContractError, ContractError::Std},
        messages::execute::ExecuteMsg,
        state::{Asset, EXCHANGE_PREFIX},
        tests::helpers::{
            get_initial_pools, get_instance, ADDR_ADMIN_OSMO, ADDR_ALICE_ATOM, ADDR_ALICE_JUNO,
            ADDR_ALICE_OSMO, ADDR_INVALID, DENOM_ATOM, DENOM_EEUR, DENOM_JUNO, DENOM_NONEXISTENT,
            FUNDS_AMOUNT, IS_REBALANCING_USED,
        },
    };

    use super::get_addr_by_prefix;

    #[test]
    fn address_native() {
        assert_eq!(
            &get_addr_by_prefix(ADDR_ALICE_OSMO, EXCHANGE_PREFIX).unwrap(),
            ADDR_ALICE_OSMO
        );
    }

    #[test]
    fn address_other() {
        assert_eq!(
            &get_addr_by_prefix(ADDR_ALICE_JUNO, EXCHANGE_PREFIX).unwrap(),
            ADDR_ALICE_OSMO
        );
    }

    #[test]
    #[should_panic = "invalid character (code=i)"]
    fn address_bad() {
        get_addr_by_prefix(ADDR_INVALID, EXCHANGE_PREFIX).unwrap();
    }

    #[test]
    fn verify_funds() {
        // try to deposit ATOM istead of stablecoin
        let funds_denom = DENOM_ATOM;
        let funds_amount = FUNDS_AMOUNT;
        let is_rebalancing_used = IS_REBALANCING_USED;

        let (mut deps, env, mut info, _) = get_instance(ADDR_ADMIN_OSMO);

        let asset_list_alice = vec![
            Asset::new(
                DENOM_ATOM,
                &Addr::unchecked(ADDR_ALICE_ATOM),
                Uint128::zero(),
                str_to_dec("0.5"),
                Uint128::zero(),
            ),
            Asset::new(
                DENOM_JUNO,
                &Addr::unchecked(ADDR_ALICE_JUNO),
                Uint128::zero(),
                str_to_dec("0.5"),
                Uint128::zero(),
            ),
        ];

        let msg = ExecuteMsg::Deposit {
            asset_list: asset_list_alice,
            day_counter: Uint128::from(3_u128),
            is_rebalancing_used,
        };
        info.funds = vec![coin(funds_amount, funds_denom)];
        info.sender = Addr::unchecked(ADDR_ALICE_OSMO);
        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

        assert_eq!(res.err(), Some(ContractError::UnexpectedFunds {}));

        // try to deposit with [0, 1.5] weights
        let funds_denom = DENOM_EEUR;

        let asset_list_alice = vec![
            Asset::new(
                DENOM_ATOM,
                &Addr::unchecked(ADDR_ALICE_ATOM),
                Uint128::zero(),
                str_to_dec("0"),
                Uint128::zero(),
            ),
            Asset::new(
                DENOM_JUNO,
                &Addr::unchecked(ADDR_ALICE_JUNO),
                Uint128::zero(),
                str_to_dec("1.5"),
                Uint128::zero(),
            ),
        ];

        let msg = ExecuteMsg::Deposit {
            asset_list: asset_list_alice,
            day_counter: Uint128::from(3_u128),
            is_rebalancing_used,
        };
        info.funds = vec![coin(funds_amount, funds_denom)];
        info.sender = Addr::unchecked(ADDR_ALICE_OSMO);
        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

        assert_eq!(res.err(), Some(ContractError::WeightIsOutOfRange {}));

        // try to deposit with [0.7, 0.5] weights
        let asset_list_alice = vec![
            Asset::new(
                DENOM_ATOM,
                &Addr::unchecked(ADDR_ALICE_ATOM),
                Uint128::zero(),
                str_to_dec("0.7"),
                Uint128::zero(),
            ),
            Asset::new(
                DENOM_JUNO,
                &Addr::unchecked(ADDR_ALICE_JUNO),
                Uint128::zero(),
                str_to_dec("0.5"),
                Uint128::zero(),
            ),
        ];

        let msg = ExecuteMsg::Deposit {
            asset_list: asset_list_alice,
            day_counter: Uint128::from(3_u128),
            is_rebalancing_used,
        };
        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

        assert_eq!(res.err(), Some(ContractError::WeightsAreUnbalanced {}));

        // try to deposit with duplicated denoms
        let asset_list_alice = vec![
            Asset::new(
                DENOM_ATOM,
                &Addr::unchecked(ADDR_ALICE_ATOM),
                Uint128::zero(),
                str_to_dec("0.3"),
                Uint128::zero(),
            ),
            Asset::new(
                DENOM_JUNO,
                &Addr::unchecked(ADDR_ALICE_JUNO),
                Uint128::zero(),
                str_to_dec("0.4"),
                Uint128::zero(),
            ),
            Asset::new(
                DENOM_ATOM,
                &Addr::unchecked(ADDR_ALICE_ATOM),
                Uint128::zero(),
                str_to_dec("0.3"),
                Uint128::zero(),
            ),
        ];

        let msg = ExecuteMsg::Deposit {
            asset_list: asset_list_alice,
            day_counter: Uint128::from(3_u128),
            is_rebalancing_used,
        };
        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

        assert_eq!(res.err(), Some(ContractError::DuplicatedAssets {}));

        // try to deposit with nonexistent denom
        let asset_list_alice = vec![
            Asset::new(
                DENOM_NONEXISTENT,
                &Addr::unchecked(ADDR_ALICE_ATOM),
                Uint128::zero(),
                str_to_dec("0.6"),
                Uint128::zero(),
            ),
            Asset::new(
                DENOM_JUNO,
                &Addr::unchecked(ADDR_ALICE_JUNO),
                Uint128::zero(),
                str_to_dec("0.4"),
                Uint128::zero(),
            ),
        ];

        let msg = ExecuteMsg::Deposit {
            asset_list: asset_list_alice,
            day_counter: Uint128::from(3_u128),
            is_rebalancing_used,
        };
        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

        assert_eq!(res.err(), Some(ContractError::AssetIsNotFound {}));

        // try to deposit with wrong address
        let asset_list_alice = vec![
            Asset::new(
                DENOM_ATOM,
                &Addr::unchecked(ADDR_INVALID),
                Uint128::zero(),
                str_to_dec("0.6"),
                Uint128::zero(),
            ),
            Asset::new(
                DENOM_JUNO,
                &Addr::unchecked(ADDR_ALICE_JUNO),
                Uint128::zero(),
                str_to_dec("0.4"),
                Uint128::zero(),
            ),
        ];

        // init pools
        let msg = ExecuteMsg::UpdatePoolsAndUsers {
            pools: get_initial_pools(),
            users: vec![],
        };
        info.sender = Addr::unchecked(ADDR_ADMIN_OSMO);
        execute(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();

        let msg = ExecuteMsg::Deposit {
            asset_list: asset_list_alice,
            day_counter: Uint128::from(3_u128),
            is_rebalancing_used,
        };
        info.sender = Addr::unchecked(ADDR_ALICE_OSMO);
        let res = execute(deps.as_mut(), env, info, msg);

        assert_eq!(
            res.err(),
            Some(Std(GenericErr {
                msg: "invalid character (code=i)".to_string()
            }))
        );
    }
}
