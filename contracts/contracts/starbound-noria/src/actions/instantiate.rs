#[cfg(not(feature = "library"))]
use cosmwasm_std::{DepsMut, Env, MessageInfo, Response};
use cw2::set_contract_version;

use crate::{
    error::ContractError,
    messages::instantiate::InstantiateMsg,
    state::{Config, CONFIG},
};

const CONTRACT_NAME: &str = "crates.io:starbound";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

pub const FEE_RATE: &str = "0.002";

pub fn init(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    let terraswap_factory = deps.api.addr_validate(&msg.terraswap_factory)?;
    let terraswap_router = deps.api.addr_validate(&msg.terraswap_router)?;

    CONFIG.save(
        deps.storage,
        &Config::new(
            &info.sender,
            &info.sender,
            &terraswap_factory,
            &terraswap_router,
            FEE_RATE,
        ),
    )?;

    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    Ok(Response::new().add_attributes(vec![
        ("method", "instantiate"),
        ("admin", info.sender.as_ref()),
    ]))
}
