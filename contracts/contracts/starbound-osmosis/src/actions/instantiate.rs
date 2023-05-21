#[cfg(not(feature = "library"))]
use cosmwasm_std::{DepsMut, Env, MessageInfo, Response};
use cw2::set_contract_version;

use crate::{
    error::ContractError,
    messages::instantiate::InstantiateMsg,
    state::{Config, Ledger, CONFIG, LEDGER},
};

const CONTRACT_NAME: &str = "crates.io:starbound";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

const STABLECOIN_DENOM: &str =
    "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F";
const STABLECOIN_POOL_ID: u64 = 481;
const FEE_DEFAULT: &str = "0.001";
const FEE_OSMO: &str = "0.002";

pub fn init(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    _msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    CONFIG.save(
        deps.storage,
        &Config::new(
            &info.sender,
            &info.sender,
            STABLECOIN_DENOM,
            STABLECOIN_POOL_ID,
            FEE_DEFAULT,
            FEE_OSMO,
        ),
    )?;

    LEDGER.save(
        deps.storage,
        &Ledger {
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
    ]))
}
