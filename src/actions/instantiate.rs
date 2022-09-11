#[cfg(not(feature = "library"))]
use cosmwasm_std::{Coin, DepsMut, Env, MessageInfo, Response};
use cw2::set_contract_version;

use crate::{
    actions::helpers::{Denoms, Pools},
    error::ContractError,
    messages::instantiate::InstantiateMsg,
    state::{Bank, Pool, State, ASSET_DENOMS, BANK, STATE},
};

const CONTRACT_NAME: &str = "crates.io:boilerplate-test";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

pub fn init(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    _msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    let asset_denoms = Denoms::list();

    asset_denoms.clone().into_iter().for_each(|(s, d)| {
        ASSET_DENOMS
            .save(deps.storage, s.to_string(), &(d.to_string()))
            .unwrap()
    });

    let pools: Vec<Pool> = Pools::list()
        .into_iter()
        .map(|(s1, s2, n)| Pool::new(s1, s2, n))
        .collect();

    let state = State {
        admin: info.sender,
        pools,
    };
    STATE.save(deps.storage, &state)?;

    let bank = Bank {
        address: env.contract.address,
        balance: Vec::<Coin>::new(),
    };
    BANK.save(deps.storage, &bank)?;

    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    Ok(Response::new().add_attributes(vec![
        ("method", "instantiate"),
        ("admin", state.admin.as_str()),
        ("pools_amount", &state.pools.len().to_string()), // 65
        ("assets_amount", &asset_denoms.len().to_string()), // 46
        ("bank_address", bank.address.as_str()),
    ]))
}
