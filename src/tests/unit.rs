use cosmwasm_std::{attr, coin, from_binary};

use crate::{
    actions::helpers::Denoms,
    contract::{execute, query},
    messages::{execute::ExecuteMsg, query::QueryMsg, response::GetDenomResponse},
    tests::helpers::{get_instance, ADDR_ALICE, ASSETS_AMOUNT_INITIAL, POOLS_AMOUNT_INITIAL},
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
fn test_deposit() {
    const FUNDS_AMOUNT: u128 = 100;
    let funds_denom = &Denoms::get("USDC").unwrap();

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
fn test_query() {
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
