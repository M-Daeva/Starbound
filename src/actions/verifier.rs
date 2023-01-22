#[cfg(not(feature = "library"))]
use cosmwasm_std::{Addr, CanonicalAddr, Decimal, DepsMut, MessageInfo, StdError, StdResult};

use crate::{
    error::ContractError,
    state::{User, CONFIG, POOLS, USERS},
};

// This simple Api provided for address verification
// because deps.api.addr_validate can not validate addresses from other networks
// https://testnet.mintscan.io/osmosis-testnet/txs/44709BCDFFAC51C1AB1245FB7AF31D14B3607357E18A57A569BD82E66DB12F06
// It based on MockApi
// https://github.com/CosmWasm/cosmwasm/blob/main/packages/std/src/testing/mock.rs
#[derive(Copy, Clone)]
pub struct LocalApi {
    length_max: usize,
    shuffles_encode: usize,
    shuffles_decode: usize,
    prefix_len_min: usize,
    prefix_len_max: usize,
    postfix_len: usize,
}

impl Default for LocalApi {
    fn default() -> Self {
        LocalApi {
            length_max: 54,
            shuffles_encode: 18,
            shuffles_decode: 2,
            prefix_len_min: 3,
            prefix_len_max: 10,
            postfix_len: 38,
        }
    }
}

impl LocalApi {
    fn digit_sum(input: &[u8]) -> usize {
        input.iter().fold(0, |sum, val| sum + (*val as usize))
    }

    pub fn riffle_shuffle<T: Clone>(input: &[T]) -> Vec<T> {
        assert!(
            input.len() % 2 == 0,
            "Method only defined for even number of elements"
        );
        let mid = input.len() / 2;
        let (left, right) = input.split_at(mid);
        let mut out = Vec::<T>::with_capacity(input.len());
        for i in 0..mid {
            out.push(right[i].clone());
            out.push(left[i].clone());
        }
        out
    }

    fn addr_canonicalize(&self, input: &str) -> StdResult<CanonicalAddr> {
        let api = Self::default();

        // check if address looks like <prefix>1<postfix> where
        // prefix is alphabetic, its length is in range [3, 10]
        // postfix is alphanumeric, its length equal 38
        let [prefix, postfix] = match input.split_once('1') {
            Some((x, y)) => [x, y],
            None => return Err(StdError::generic_err("Invalid input: wrong address format")),
        };

        if prefix.len() < api.prefix_len_min {
            return Err(StdError::generic_err("Invalid input: prefix is too short"));
        }

        if prefix.len() > api.prefix_len_max {
            return Err(StdError::generic_err("Invalid input: prefix is too long"));
        }

        if postfix.len() != api.postfix_len {
            return Err(StdError::generic_err(
                "Invalid input: postfix is too short/long",
            ));
        }

        if prefix.chars().any(|c| !c.is_ascii_alphabetic()) {
            return Err(StdError::generic_err(
                "Invalid input: prefix is not alphabetic",
            ));
        }

        if postfix.chars().any(|c| !c.is_ascii_alphanumeric()) {
            return Err(StdError::generic_err(
                "Invalid input: postfix is not alis_ascii_alphanumeric",
            ));
        }

        // mimicks formats like hex or bech32 where different casings are valid for one address
        let normalized = input.to_lowercase();

        let mut out = Vec::from(normalized);

        // pad to canonical length with NULL bytes
        out.resize(api.length_max, 0x00);
        // content-dependent rotate followed by shuffle to destroy
        // the most obvious structure (https://github.com/CosmWasm/cosmwasm/issues/552)
        let rotate_by = Self::digit_sum(&out) % api.length_max;
        out.rotate_left(rotate_by);
        for _ in 0..api.shuffles_encode {
            out = Self::riffle_shuffle(&out);
        }
        Ok(out.into())
    }

    fn addr_humanize(&self, canonical: &CanonicalAddr) -> StdResult<Addr> {
        let api = Self::default();

        if canonical.len() != api.length_max {
            return Err(StdError::generic_err(
                "Invalid input: canonical address length not correct",
            ));
        }

        let mut tmp: Vec<u8> = canonical.clone().into();
        // Shuffle two more times which restored the original value (24 elements are back to original after 20 rounds)
        for _ in 0..api.shuffles_decode {
            tmp = Self::riffle_shuffle(&tmp);
        }
        // Rotate back
        let rotate_by = Self::digit_sum(&tmp) % api.length_max;
        tmp.rotate_right(rotate_by);
        // Remove NULL bytes (i.e. the padding)
        let trimmed = tmp.into_iter().filter(|&x| x != 0x00).collect();
        // decode UTF-8 bytes into string
        let human = String::from_utf8(trimmed)?;
        Ok(Addr::unchecked(human))
    }

    pub fn addr_validate(&self, input: &str) -> StdResult<Addr> {
        let canonical = self.addr_canonicalize(input)?;
        let normalized = self.addr_humanize(&canonical)?;
        if input != normalized {
            return Err(StdError::generic_err(
                "Invalid input: address not normalized",
            ));
        }

        Ok(Addr::unchecked(input))
    }
}

// data verification for deposit method
pub fn verify_deposit_data(
    deps: &DepsMut,
    info: &MessageInfo,
    user: &User,
) -> Result<(), ContractError> {
    // check funds
    let config = CONFIG.load(deps.storage)?;
    let denom_token_in = config.stablecoin_denom;

    // only single stablecoin payments are allowed
    if info.funds.len() > 1 || (info.funds.len() == 1 && info.funds[0].denom != denom_token_in) {
        return Err(ContractError::UnexpectedFunds {});
    }

    // skip checking assets and weight if we need just add funds and update day counter
    if user.asset_list.is_empty() && USERS.load(deps.storage, &info.sender).is_ok() {
        return Ok(());
    }

    // check if all weights are in range [0, 1]
    if user
        .asset_list
        .iter()
        .any(|asset| asset.weight.lt(&Decimal::zero()) || asset.weight.gt(&Decimal::one()))
    {
        return Err(ContractError::WeightIsOutOfRange {});
    }

    // check if sum of weights is equal one
    let weight_sum = user
        .asset_list
        .iter()
        .fold(Decimal::zero(), |acc, cur| acc + cur.weight);

    if weight_sum.ne(&Decimal::one()) {
        return Err(ContractError::WeightsAreUnbalanced {});
    }

    // check if asset_list contains unique denoms
    let mut list = user
        .asset_list
        .iter()
        .map(|x| x.asset_denom.clone())
        .collect::<Vec<String>>();

    list.sort();
    list.dedup();

    if list.len() != user.asset_list.len() {
        return Err(ContractError::DuplicatedAssets {});
    }

    // verify asset list
    for asset in &user.asset_list {
        // check if asset exists in pool list
        if POOLS.load(deps.storage, &asset.asset_denom).is_err() {
            return Err(ContractError::AssetIsNotFound {});
        };

        // validate wallet address
        LocalApi::default().addr_validate(asset.wallet_address.as_str())?;
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
    use cosmwasm_std::{coin, Addr, StdError, StdError::GenericErr, Uint128};

    use crate::{
        actions::rebalancer::str_to_dec,
        contract::execute,
        error::{ContractError, ContractError::Std},
        messages::execute::ExecuteMsg,
        state::{Asset, User},
        tests::helpers::{
            get_initial_pools, get_instance, ADDR_ADMIN_OSMO, ADDR_ALICE_ATOM, ADDR_ALICE_JUNO,
            ADDR_ALICE_OSMO, ADDR_INVALID, DENOM_ATOM, DENOM_EEUR, DENOM_JUNO, DENOM_NONEXISTENT,
            FUNDS_AMOUNT, IS_CONTROLLED_REBALANCING,
        },
    };

    use super::LocalApi;

    #[test]
    fn address_native() {
        let addr = ADDR_ALICE_OSMO;

        assert_eq!(
            LocalApi::default().addr_validate(addr).unwrap(),
            Addr::unchecked(addr)
        );
    }

    #[test]
    fn address_other() {
        let addr = ADDR_ALICE_JUNO;

        assert_eq!(
            LocalApi::default().addr_validate(addr).unwrap(),
            Addr::unchecked(addr)
        );
    }

    #[test]
    fn address_bad() {
        let addr = "bad address";

        assert_eq!(
            LocalApi::default().addr_validate(addr).unwrap_err(),
            StdError::generic_err("Invalid input: wrong address format")
        );
    }

    #[test]
    fn verify_funds() {
        // try to deposit ATOM istead of stablecoin
        let funds_denom = DENOM_ATOM;
        let funds_amount = FUNDS_AMOUNT;
        let is_controlled_rebalancing = IS_CONTROLLED_REBALANCING;

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

        let user = User {
            asset_list: asset_list_alice,
            day_counter: Uint128::from(3_u128),
            deposited: Uint128::from(funds_amount),
            is_controlled_rebalancing,
        };

        let msg = ExecuteMsg::Deposit { user };
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

        let user = User {
            asset_list: asset_list_alice,
            day_counter: Uint128::from(3_u128),
            deposited: Uint128::from(funds_amount),
            is_controlled_rebalancing,
        };

        let msg = ExecuteMsg::Deposit { user };
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

        let user = User {
            asset_list: asset_list_alice,
            day_counter: Uint128::from(3_u128),
            deposited: Uint128::from(funds_amount),
            is_controlled_rebalancing,
        };

        let msg = ExecuteMsg::Deposit { user };
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

        let user = User {
            asset_list: asset_list_alice,
            day_counter: Uint128::from(3_u128),
            deposited: Uint128::from(funds_amount),
            is_controlled_rebalancing,
        };

        let msg = ExecuteMsg::Deposit { user };
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

        let user = User {
            asset_list: asset_list_alice,
            day_counter: Uint128::from(3_u128),
            deposited: Uint128::from(funds_amount),
            is_controlled_rebalancing,
        };

        let msg = ExecuteMsg::Deposit { user };
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

        let user = User {
            asset_list: asset_list_alice,
            day_counter: Uint128::from(3_u128),
            deposited: Uint128::from(funds_amount),
            is_controlled_rebalancing,
        };

        let msg = ExecuteMsg::Deposit { user };
        info.sender = Addr::unchecked(ADDR_ALICE_OSMO);
        let res = execute(deps.as_mut(), env, info, msg);

        assert_eq!(
            res.err(),
            Some(Std(GenericErr {
                msg: "Invalid input: wrong address format".to_string()
            }))
        );
    }
}
