use cosmwasm_std::{
    coin,
    testing::{mock_dependencies, mock_env, mock_info, MockApi, MockQuerier, MockStorage},
    Empty, Env, MessageInfo, OwnedDeps, Response,
};

use crate::{
    actions::helpers::Denoms,
    contract::{execute, instantiate},
    error::ContractError,
    messages::{execute::ExecuteMsg, instantiate::InstantiateMsg},
};

pub const ADDR_ALICE: &str = "osmo1cyyzpxplxdzkeea7kwsydadg87357qnahakaks";
pub const ADDR_ALICE_WASM: &str = "wasm1cyyzpxplxdzkeea7kwsydadg87357qna465cff";
pub const ADDR_BOB: &str = "osmo1chgwz55h9kepjq0fkj5supl2ta3nwu63e3ds8x";

pub const POOLS_AMOUNT_INITIAL: &str = "65";
pub const ASSETS_AMOUNT_INITIAL: &str = "46";

// temporary replacement to work with testnet
// there is no USDC on testnet so we use OSMO instead of USDC
pub const SYMBOL_TOKEN_IN: &str = "OSMO";
//pub const SYMBOL_TOKEN_IN: &str = "USDC";
pub const SYMBOL_TOKEN_OUT: &str = "ATOM";
pub const SYMBOL_TOKEN_NONEX: &str = "NONEXISTENT TOKEN";

pub const CHANNEL_ID: &str = "channel-0";

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
    let funds_denom = &Denoms::get(SYMBOL_TOKEN_IN).unwrap();

    let (mut deps, env, mut info, _) = get_instance(ADDR_ALICE);
    let msg = ExecuteMsg::Deposit {
        is_controlled_rebalancing,
        is_current_period,
    };
    info.funds = vec![coin(funds_amount, funds_denom)];
    let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

    (deps, env, info, res)
}
