#[cfg(not(feature = "library"))]
use cosmwasm_std::{
    coin, Coin, CosmosMsg, DepsMut, Env, IbcMsg, IbcTimeout, MessageInfo, Response,
};
use osmosis_std::types::{
    cosmos::base::v1beta1::Coin as PoolCoin, osmosis::gamm::v1beta1::MsgSwapExactAmountIn,
};

use crate::{
    actions::helpers::Pools,
    error::ContractError,
    state::{User, ASSET_DENOMS, BANK, USERS},
};

// TODO: add users portfolio structure settings
pub fn deposit(deps: DepsMut, _env: Env, info: MessageInfo) -> Result<Response, ContractError> {
    // temporary replacement to work with testnet
    // there is no USDC on testnet so we use OSMO instead of USDC
    let symbol_token_in = "OSMO";
    //let symbol_token_in = "USDC";
    let denom_token_in = ASSET_DENOMS.load(deps.storage, symbol_token_in.to_string())?;
    let user_addr = &info.sender;
    let funds = &info
        .funds
        .into_iter()
        .filter(|item| item.denom == denom_token_in)
        .collect::<Vec<Coin>>();

    if funds.is_empty() {
        return Err(ContractError::FundsIsNotFound {});
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

// TODO: add users and bank changing funds logic
pub fn swap_tokens(
    deps: DepsMut,
    env: Env,
    _info: MessageInfo,
    // from: String,
    // to: String,
    // amount: u128,
) -> Result<Response, ContractError> {
    // temporary hardcoded to be sure that all works fine on contract side
    let from = "OSMO".to_string();
    let to = "ATOM".to_string();
    let amount: u128 = 1_000;

    // TODO: add validation to prevent using denom instead of symbol
    let denom_token_in = ASSET_DENOMS.load(deps.storage, from.clone())?;
    let token_out_min_amount = String::from("1");

    let msg = MsgSwapExactAmountIn {
        sender: env.contract.address.to_string(),
        routes: Pools::get_routes(&from, &to)?,
        token_in: Some(PoolCoin {
            amount: amount.to_string(),
            denom: denom_token_in,
        }),
        token_out_min_amount,
    };

    Ok(Response::new().add_message(msg).add_attributes(vec![
        ("method", "swap_tokens"),
        ("from", &from),
        ("to", &to),
        ("amount", &amount.to_string()),
    ]))
}

#[allow(clippy::too_many_arguments)]
pub fn transfer(
    deps: DepsMut,
    env: Env,
    _info: MessageInfo,
    receiver_addr: String,
    channel_id: String,
    token_amount: u128,
    token_symbol: String,
) -> Result<Response, ContractError> {
    const TIMEOUT: u64 = 300;
    // TODO: add validation to prevent using denom instead of symbol
    let token_denom = ASSET_DENOMS.load(deps.storage, token_symbol.clone())?;

    let timestamp = env.block.time.plus_seconds(TIMEOUT);

    let msg = CosmosMsg::Ibc(IbcMsg::Transfer {
        channel_id: channel_id.clone(),
        to_address: receiver_addr.clone(),
        amount: coin(token_amount, token_denom),
        timeout: IbcTimeout::with_timestamp(timestamp),
    });

    Ok(Response::new().add_message(msg).add_attributes(vec![
        ("method", "transfer"),
        ("receiver_addr", &receiver_addr),
        ("channel_id", &channel_id),
        ("token_amount", &token_amount.to_string()),
        ("token_symbol", &token_symbol),
    ]))
}
