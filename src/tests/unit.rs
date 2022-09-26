use cosmwasm_std::{attr, coin, from_binary, Addr};

use crate::{
    actions::helpers::Denoms,
    contract::{execute, query},
    messages::{
        execute::ExecuteMsg,
        query::QueryMsg,
        response::{
            GetAllDenomsResponse, GetAllPoolsResponse, GetBankBalanceResponse, GetDenomResponse,
            GetUserInfoResponse,
        },
    },
    tests::helpers::{
        get_instance, ADDR_ALICE, ADDR_ALICE_WASM, ADDR_BOB, ASSETS_AMOUNT_INITIAL, CHANNEL_ID,
        POOLS_AMOUNT_INITIAL, SYMBOL_TOKEN_IN, SYMBOL_TOKEN_NONEX, SYMBOL_TOKEN_OUT,
    },
};

#[test]
fn test_init() {
    let (_, env, _, res) = get_instance(ADDR_ALICE);

    assert_eq!(
        res.unwrap().attributes,
        vec![
            attr("method", "instantiate"),
            attr("admin", ADDR_ALICE),
            attr("pools_amount", POOLS_AMOUNT_INITIAL),
            attr("assets_amount", ASSETS_AMOUNT_INITIAL),
            attr("bank_address", env.contract.address),
        ]
    )
}

#[test]
fn test_execute_deposit() {
    const FUNDS_AMOUNT: u128 = 100;
    let funds_denom = &Denoms::get(SYMBOL_TOKEN_IN).unwrap();

    let (mut deps, env, mut info, _) = get_instance(ADDR_ALICE);
    let msg = ExecuteMsg::Deposit {};
    info.funds = vec![coin(FUNDS_AMOUNT, funds_denom)];
    let res = execute(deps.as_mut(), env, info, msg);

    assert_eq!(
        res.unwrap().attributes,
        vec![
            attr("method", "deposit"),
            attr("user_address", ADDR_ALICE),
            attr("user_deposit", FUNDS_AMOUNT.to_string())
        ]
    )
}

// #[test]
// fn test_execute_swap_tokens() {
//     const FUNDS_AMOUNT: u128 = 100;
//     let funds_denom = &Denoms::get(SYMBOL_TOKEN_IN).unwrap();

//     let (mut deps, env, mut info, _) = get_instance(ADDR_ALICE);
//     let msg = ExecuteMsg::Deposit {};
//     info.funds = vec![coin(FUNDS_AMOUNT, funds_denom)];
//     let _res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

//     let msg = ExecuteMsg::SwapTokens {
//         from: SYMBOL_TOKEN_IN.to_string(),
//         to: SYMBOL_TOKEN_OUT.to_string(),
//         amount: FUNDS_AMOUNT,
//     };

//     let res = execute(deps.as_mut(), env, info, msg);

//     assert_eq!(
//         res.unwrap().attributes,
//         vec![
//             attr("method", "swap_tokens"),
//             attr("from", SYMBOL_TOKEN_IN),
//             attr("to", SYMBOL_TOKEN_OUT),
//             attr("amount", FUNDS_AMOUNT.to_string())
//         ]
//     )
// }

#[test]
fn test_execute_ibc_transfer() {
    const FUNDS_AMOUNT: u128 = 10_000;
    let funds_denom = &Denoms::get(SYMBOL_TOKEN_IN).unwrap();

    let (mut deps, env, mut info, _) = get_instance(ADDR_ALICE);
    let msg = ExecuteMsg::Deposit {};
    info.funds = vec![coin(FUNDS_AMOUNT, funds_denom)];
    let _res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

    let msg = ExecuteMsg::Transfer {
        receiver_addr: ADDR_ALICE_WASM.to_string(),
        channel_id: CHANNEL_ID.to_string(),
        token_amount: (FUNDS_AMOUNT / 10).to_string(),
        token_symbol: SYMBOL_TOKEN_IN.to_string(),
    };

    let res = execute(deps.as_mut(), env, info, msg);

    assert_eq!(
        res.unwrap().attributes,
        vec![
            attr("method", "transfer"),
            attr("receiver_addr", ADDR_ALICE_WASM),
            attr("channel_id", CHANNEL_ID),
            attr("token_amount", (FUNDS_AMOUNT / 10).to_string()),
            attr("token_symbol", SYMBOL_TOKEN_IN),
        ]
    )
}

#[test]
fn test_query_get_denom() {
    let denom_token_out = Denoms::get(SYMBOL_TOKEN_OUT).unwrap();

    let (deps, env, _, _) = get_instance(ADDR_ALICE);
    let msg = QueryMsg::GetDenom {
        asset_symbol: SYMBOL_TOKEN_OUT.to_string(),
    };
    let bin = query(deps.as_ref(), env, msg).unwrap();
    let res = from_binary::<GetDenomResponse>(&bin).unwrap();

    assert_eq!(res.denom, denom_token_out);
}

#[test]
fn test_query_get_nonexistent_denom() {
    let (deps, env, _, _) = get_instance(ADDR_ALICE);
    let msg = QueryMsg::GetDenom {
        asset_symbol: SYMBOL_TOKEN_NONEX.to_string(),
    };
    let bin = query(deps.as_ref(), env, msg);

    bin.unwrap_err();
}

#[test]
fn test_query_get_all_denoms() {
    let (deps, env, _, _) = get_instance(ADDR_ALICE);
    let msg = QueryMsg::GetAllDenoms {};
    let bin = query(deps.as_ref(), env, msg).unwrap();
    let res = from_binary::<GetAllDenomsResponse>(&bin).unwrap();

    assert_eq!(
        res.all_assets_info.len(),
        ASSETS_AMOUNT_INITIAL.parse::<usize>().unwrap()
    );
}

#[test]
fn test_query_get_all_pools() {
    let (deps, env, _, _) = get_instance(ADDR_ALICE);
    let msg = QueryMsg::GetAllPools {};
    let bin = query(deps.as_ref(), env, msg).unwrap();
    let res = from_binary::<GetAllPoolsResponse>(&bin).unwrap();

    assert_eq!(
        res.all_pools.len(),
        POOLS_AMOUNT_INITIAL.parse::<usize>().unwrap()
    );
}

#[test]
fn test_query_get_bank_balance() {
    let (deps, env, _, _) = get_instance(ADDR_ALICE);
    let msg = QueryMsg::GetBankBalance {};
    let bin = query(deps.as_ref(), env, msg).unwrap();
    let res = from_binary::<GetBankBalanceResponse>(&bin).unwrap();

    assert!(res.balance.is_empty());
}

#[test]
fn test_query_get_user_info() {
    const FUNDS_AMOUNT: u128 = 100;
    let funds_denom = &Denoms::get(SYMBOL_TOKEN_IN).unwrap();

    let (mut deps, env, mut info, _) = get_instance(ADDR_ALICE);
    let msg = ExecuteMsg::Deposit {};
    info.funds = vec![coin(FUNDS_AMOUNT, funds_denom)];
    info.sender = Addr::unchecked(ADDR_BOB);
    let _res = execute(deps.as_mut(), env.clone(), info, msg);

    let msg = QueryMsg::GetUserInfo {
        address: ADDR_BOB.to_string(),
    };
    let bin = query(deps.as_ref(), env, msg).unwrap();
    let res = from_binary::<GetUserInfoResponse>(&bin).unwrap();

    assert_eq!(res.deposited.u128(), FUNDS_AMOUNT);
}
