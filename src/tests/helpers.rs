use cosmwasm_std::{
    coin,
    testing::{mock_dependencies, mock_env, mock_info, MockApi, MockQuerier, MockStorage},
    Addr, Empty, Env, MessageInfo, OwnedDeps, Response, Uint128,
};

use crate::{
    actions::rebalancer::str_to_dec,
    contract::{execute, instantiate},
    error::ContractError,
    messages::{execute::ExecuteMsg, instantiate::InstantiateMsg},
    state::{Asset, User},
};

pub const ADDR_ADMIN_OSMO: &str = "osmo1k6ja23e7t9w2n87m2dn0cc727ag9pjkm2xlmck";

pub const ADDR_ALICE_OSMO: &str = "osmo1gjqnuhv52pd2a7ets2vhw9w9qa9knyhy7y9tgx";
pub const ADDR_ALICE_JUNO: &str = "juno1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyqd4qeg";
pub const ADDR_ALICE_ATOM: &str = "cosmos1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyklkm75";

pub const ADDR_BOB_OSMO: &str = "osmo1chgwz55h9kepjq0fkj5supl2ta3nwu63e3ds8x";
pub const ADDR_BOB_JUNO: &str = "juno1chgwz55h9kepjq0fkj5supl2ta3nwu638camkg";
pub const ADDR_BOB_ATOM: &str = "cosmos1chgwz55h9kepjq0fkj5supl2ta3nwu63327q35";

pub const ADDR_INVALID: &str = "ADDR_INVALID";

pub const DENOM_ATOM: &str = "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2";
pub const DENOM_JUNO: &str = "ibc/46B44899322F3CD854D2D46DEEF881958467CDD4B3B10086DA49296BBED94BED";
pub const DENOM_EEUR: &str = "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F";
pub const DENOM_NONEXISTENT: &str = "DENOM_NONEXISTENT";

pub const POOLS_AMOUNT_INITIAL: &str = "3";

pub const CHANNEL_ID: &str = "channel-1100";

pub const IS_CONTROLLED_REBALANCING: bool = true;
pub const IS_CURRENT_PERIOD: bool = true;
pub const FUNDS_AMOUNT: u128 = 10_000;

pub type Instance = (
    OwnedDeps<MockStorage, MockApi, MockQuerier, Empty>,
    Env,
    MessageInfo,
    Result<Response, ContractError>,
);

pub fn get_instance(addr: &str) -> Instance {
    let mut deps = mock_dependencies();
    let env = mock_env();
    let info = mock_info(addr, &[]);
    let msg = InstantiateMsg {};

    let res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg);
    (deps, env, info, res)
}

pub fn instantiate_and_deposit(
    is_controlled_rebalancing: bool,
    is_current_period: bool,
    funds_amount: u128,
) -> Instance {
    let funds_denom = DENOM_EEUR;

    let user_deposited_on_current_period = if is_current_period { funds_amount } else { 0 };
    let user_deposited_on_next_period = if !is_current_period { funds_amount } else { 0 };

    let (mut deps, env, mut info, _) = get_instance(ADDR_ADMIN_OSMO);

    let asset_list_alice = vec![
        Asset {
            asset_denom: DENOM_ATOM.to_string(),
            wallet_address: Addr::unchecked(ADDR_ALICE_ATOM),
            wallet_balance: Uint128::zero(),
            weight: str_to_dec("0.5"),
            amount_to_send_until_next_epoch: Uint128::zero(),
        },
        Asset {
            asset_denom: DENOM_JUNO.to_string(),
            wallet_address: Addr::unchecked(ADDR_ALICE_JUNO),
            wallet_balance: Uint128::zero(),
            weight: str_to_dec("0.5"),
            amount_to_send_until_next_epoch: Uint128::zero(),
        },
    ];

    let user = User {
        asset_list: asset_list_alice,
        day_counter: Uint128::from(3_u128),
        deposited_on_current_period: Uint128::from(user_deposited_on_current_period),
        deposited_on_next_period: Uint128::from(user_deposited_on_next_period),
        is_controlled_rebalancing,
    };

    let msg = ExecuteMsg::Deposit { user };
    info.funds = vec![coin(funds_amount, funds_denom)];
    info.sender = Addr::unchecked(ADDR_ALICE_OSMO);
    let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

    (deps, env, info, res)
}
