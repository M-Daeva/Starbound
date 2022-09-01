#[cfg(not(feature = "library"))]
use cosmwasm_std::{DepsMut, Env, MessageInfo, Response};

use crate::{error::ContractError, state::STATE};

pub fn set(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    count: u8,
) -> Result<Response, ContractError> {
    let mut state = STATE.load(deps.storage)?;

    if info.sender != state.owner {
        return Err(ContractError::CustomError {
            val: "Sender is not owner!".to_string(),
        });
    }

    state.count = count;
    STATE.save(deps.storage, &state)?;

    Ok(Response::new()
        .add_attribute("method", "set")
        .add_attribute("owner", state.owner.to_string())
        .add_attribute("count", state.count.to_string()))
}
