#[cfg(not(feature = "library"))]
use cosmwasm_std::{coin, Coin, DepsMut, Env, MessageInfo, Response};

use crate::{
    error::ContractError,
    state::{User, ASSET_DENOMS, BANK, USERS},
};

pub fn deposit(deps: DepsMut, _env: Env, info: MessageInfo) -> Result<Response, ContractError> {
    let denom_usdc = ASSET_DENOMS.load(deps.storage, "USDC".to_string())?;
    let user_addr = &info.sender;
    let funds = &info
        .funds
        .into_iter()
        .filter(|item| item.denom == denom_usdc)
        .collect::<Vec<Coin>>();

    if funds.is_empty() {
        return Err(ContractError::UsdcNotFound {});
    }

    let funds_amount = funds[0].amount;
    let funds_denom = &funds[0].denom;

    let mut bank = BANK.load(deps.storage)?;
    let mut user = match USERS.load(deps.storage, user_addr.clone()) {
        Ok(user) => user,
        _ => User::new(user_addr.clone()),
    };

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
