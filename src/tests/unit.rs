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
        get_instance, ADDR_ALICE, ADDR_BOB, ASSETS_AMOUNT_INITIAL, POOLS_AMOUNT_INITIAL,
        SYMBOL_JUNO, SYMBOL_USDC,
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
    let funds_denom = &Denoms::get(SYMBOL_USDC).unwrap();

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

#[test]
fn test_execute_swap_tokens() {
    const FUNDS_AMOUNT: u128 = 100;
    let funds_denom = &Denoms::get(SYMBOL_USDC).unwrap();

    let (mut deps, env, mut info, _) = get_instance(ADDR_ALICE);
    let msg = ExecuteMsg::Deposit {};
    info.funds = vec![coin(FUNDS_AMOUNT, funds_denom)];
    let _res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

    let msg = ExecuteMsg::SwapTokens {
        from: SYMBOL_USDC.to_string(),
        to: SYMBOL_JUNO.to_string(),
        amount: FUNDS_AMOUNT,
    };

    let res = execute(deps.as_mut(), env, info, msg);

    assert_eq!(
        res.unwrap().attributes,
        vec![
            attr("method", "swap_tokens"),
            attr("from", SYMBOL_USDC),
            attr("to", SYMBOL_JUNO),
            attr("amount", FUNDS_AMOUNT.to_string())
        ]
    )
}

#[test]
fn test_query_get_denom() {
    const SYMBOL_JUNO: &str = "JUNO";
    let denom_juno = Denoms::get(SYMBOL_JUNO).unwrap();

    let (deps, env, _, _) = get_instance(ADDR_ALICE);
    let msg = QueryMsg::GetDenom {
        asset_symbol: SYMBOL_JUNO.to_string(),
    };
    let bin = query(deps.as_ref(), env, msg).unwrap();
    let res = from_binary::<GetDenomResponse>(&bin).unwrap();

    assert_eq!(res.denom, denom_juno);
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
    let funds_denom = &Denoms::get("USDC").unwrap();

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
