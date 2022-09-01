#[cfg(not(feature = "library"))]
use cosmwasm_std::{DepsMut, Env, Response};

use crate::{error::ContractError, messages::migrate::MigrateMsg};

pub fn migrate_contract(
    _deps: DepsMut,
    _env: Env,
    _msg: MigrateMsg,
) -> Result<Response, ContractError> {
    Ok(Response::default())
}
