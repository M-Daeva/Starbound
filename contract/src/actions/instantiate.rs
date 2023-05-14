#[cfg(not(feature = "library"))]
use cosmwasm_std::{DepsMut, Env, MessageInfo, Response, Timestamp};
use cw2::set_contract_version;

use crate::{
    actions::helpers::math::str_to_dec,
    error::ContractError,
    messages::instantiate::InstantiateMsg,
    state::{Config, Ledger, CONFIG, LEDGER},
};

const CONTRACT_NAME: &str = "crates.io:boilerplate-test";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

// TODO: replace EEUR -> USDC on mainnet
const STABLECOIN_DENOM: &str =
    "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F";
const STABLECOIN_POOL_ID: u64 = 481;

pub fn init(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    _msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    CONFIG.save(
        deps.storage,
        &Config {
            admin: info.sender.clone(),
            scheduler: info.sender.clone(),
            stablecoin_denom: STABLECOIN_DENOM.to_string(),
            stablecoin_pool_id: STABLECOIN_POOL_ID,
            fee_default: str_to_dec("0.001"),
            fee_osmo: str_to_dec("0.002"),
            dapp_address_and_denom_list: vec![],
            timestamp: Timestamp::default(),
        },
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
