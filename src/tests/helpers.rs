use cosmwasm_std::{
    testing::{mock_dependencies, mock_env, mock_info, MockApi, MockQuerier, MockStorage},
    Empty, Env, MessageInfo, OwnedDeps, Response,
};

use crate::{contract::instantiate, error::ContractError, messages::instantiate::InstantiateMsg};

pub const ADDR1: &str = "juno1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyqd4qeg";

pub const VALUE1: u8 = 42;
pub const VALUE2: u8 = 45;

pub type Instance = (
    OwnedDeps<MockStorage, MockApi, MockQuerier, Empty>,
    Env,
    MessageInfo,
    Result<Response, ContractError>,
);

pub fn get_instance(count: u8, addr: &str) -> Instance {
    let mut deps = mock_dependencies();
    let env = mock_env();
    let info = mock_info(addr, &[]);
    let msg = InstantiateMsg { count };

    let res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg);
    (deps, env, info, res)
}
