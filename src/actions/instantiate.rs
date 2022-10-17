#[cfg(not(feature = "library"))]
use cosmwasm_std::{DepsMut, Env, MessageInfo, Response};
use cw2::set_contract_version;

use crate::{
    actions::rebalancer::u128_to_dec,
    error::ContractError,
    messages::instantiate::InstantiateMsg,
    state::{Pool, State, POOLS, STATE},
};

const CONTRACT_NAME: &str = "crates.io:boilerplate-test";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

pub fn init(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    _msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    // testnet config
    // ATOM / OSMO
    POOLS.save(
        deps.storage,
        "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2",
        &Pool::new(1, u128_to_dec(13), "channel-1110", "transfer", "uatom"),
    )?;

    // JUNO / OSMO
    POOLS.save(
        deps.storage,
        "ibc/46B44899322F3CD854D2D46DEEF881958467CDD4B3B10086DA49296BBED94BED",
        &Pool::new(497, u128_to_dec(4), "channel-1110", "transfer", "ujuno"),
    )?;

    // EEUR / OSMO
    POOLS.save(
        deps.storage,
        "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F",
        &Pool::new(
            481,
            u128_to_dec(1),
            "debug_ch_id",
            "transfer",
            "debug_ueeur",
        ),
    )?;

    STATE.save(
        deps.storage,
        &State {
            admin: info.sender.clone(),
            scheduler: info.sender.clone(),
            global_delta_balance_list: vec![],
            global_delta_cost_list: vec![],
            global_denom_list: vec![],
            global_price_list: vec![],
        },
    )?;

    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    Ok(Response::new().add_attributes(vec![
        ("method", "instantiate"),
        ("admin", info.sender.as_ref()),
        ("scheduler", info.sender.as_ref()),
        ("pools_amount", "3"),
    ]))
}
