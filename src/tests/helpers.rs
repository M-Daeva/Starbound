use cosmwasm_std::{
    testing::{mock_dependencies, mock_env, mock_info, MockApi, MockQuerier, MockStorage},
    Empty, Env, MessageInfo, OwnedDeps, Response,
};

use crate::{contract::instantiate, error::ContractError, messages::instantiate::InstantiateMsg};

pub const ADDR_ALICE: &str = "osmo1gjqnuhv52pd2a7ets2vhw9w9qa9knyhy7y9tgx";
pub const ADDR_BOB: &str = "osmo1chgwz55h9kepjq0fkj5supl2ta3nwu63e3ds8x";

pub const POOLS_AMOUNT_INITIAL: &str = "65";
pub const ASSETS_AMOUNT_INITIAL: &str = "46";

pub const SYMBOL_USDC: &str = "USDC";
pub const SYMBOL_JUNO: &str = "JUNO";

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
