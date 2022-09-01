#[cfg(not(feature = "library"))]
use cosmwasm_std::{to_binary, Binary, Deps, Env, StdResult};

use crate::{messages::response::CountResponse, state::STATE};

pub fn query_state(deps: Deps, _env: Env) -> StdResult<Binary> {
    let state = STATE.load(deps.storage)?;

    to_binary(&CountResponse { count: state.count })
}
