#[cfg(not(feature = "library"))]
use cosmwasm_std::{DepsMut, Env, MessageInfo, Response};
use cw2::set_contract_version;

use crate::{
    actions::helpers::{Denoms, Pools},
    error::ContractError,
    messages::instantiate::InstantiateMsg,
    state::{PoolInfo, State, ASSET_DENOMS, STATE},
};

const CONTRACT_NAME: &str = "crates.io:boilerplate-test";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

pub fn init(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    _msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    let asset_denoms = Denoms::list();

    asset_denoms.clone().into_iter().for_each(|(s, d)| {
        ASSET_DENOMS
            .save(deps.storage, s.to_string(), &(d.to_string()))
            .unwrap()
    });

    let pool_list: Vec<PoolInfo> = Pools::list()
        .into_iter()
        .map(|(s1, s2, n)| PoolInfo::new(s1, s2, n))
        .collect();

    let state = State {
        admin: info.sender.clone(),
        scheduler: info.sender,
        pool_list,
    };
    STATE.save(deps.storage, &state)?;

    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    Ok(Response::new().add_attributes(vec![
        ("method", "instantiate"),
        ("admin", state.admin.as_str()),
        ("scheduler", state.scheduler.as_str()),
        ("pools_amount", &state.pool_list.len().to_string()), // 65
        ("assets_amount", &asset_denoms.len().to_string()),   // 46
    ]))
}
