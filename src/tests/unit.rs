use cosmwasm_std::{attr, coin, from_binary};

use crate::{
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
    const FUNDS_DENOM: &str = "uosmo";

    let (mut deps, env, mut info, _) = get_instance(ADDR_ALICE);
    let msg = ExecuteMsg::Deposit {};
    info.funds = vec![coin(FUNDS_AMOUNT, FUNDS_DENOM)];
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
    const JUNO_SYMBOL: &str = "JUNO";
    const JUNO_DENOM: &str = "ibc/46B44899322F3CD854D2D46DEEF881958467CDD4B3B10086DA49296BBED94BED";

    let (deps, env, _, _) = get_instance(ADDR_ALICE);
    let msg = QueryMsg::GetDenom {
        asset_symbol: JUNO_SYMBOL.to_string(),
    };
    let bin = query(deps.as_ref(), env, msg).unwrap();
    let res = from_binary::<GetDenomResponse>(&bin).unwrap();

    assert_eq!(res.denom, JUNO_DENOM);
}
