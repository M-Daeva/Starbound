#[cfg(not(feature = "library"))]
use cosmwasm_std::{DepsMut, Env, MessageInfo, Response};
use cw2::set_contract_version;

use crate::{
    error::ContractError,
    messages::instantiate::InstantiateMsg,
    state::{State, STATE},
};

const CONTRACT_NAME: &str = "crates.io:boilerplate-test";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

pub fn init(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    let initial_state = State {
        owner: info.sender,
        count: msg.count,
    };

    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    STATE.save(deps.storage, &initial_state)?;

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("owner", initial_state.owner.to_string())
        .add_attribute("count", initial_state.count.to_string()))
}
