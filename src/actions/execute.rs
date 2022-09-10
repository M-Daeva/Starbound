use cosmwasm_std::coin;
#[cfg(not(feature = "library"))]
use cosmwasm_std::{DepsMut, Env, MessageInfo, Response};

use crate::{
    error::ContractError,
    state::{User, BANK, USERS},
};

pub fn deposit(deps: DepsMut, _env: Env, info: MessageInfo) -> Result<Response, ContractError> {
    let user_addr = &info.sender;
    let funds = &info.funds[0];
    let funds_amount = funds.amount;
    let funds_denom = &funds.denom;

    let mut bank = BANK.load(deps.storage)?;
    let mut user = match USERS.load(deps.storage, user_addr.clone()) {
        Ok(user) => user,
        _ => User::new(user_addr.clone()),
    };

    // TODO: rewwrite for axlUSDC
    user.deposited = funds_amount;
    bank.balance.push(coin(funds_amount.u128(), funds_denom));

    USERS.save(deps.storage, user_addr.clone(), &user)?;
    BANK.save(deps.storage, &bank)?;

    Ok(Response::new().add_attributes(vec![
        ("method", "deposit"),
        ("user_address", user.address.as_str()),
        ("user_deposit", &user.deposited.to_string()),
    ]))
}
