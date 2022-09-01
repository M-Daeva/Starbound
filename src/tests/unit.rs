use cosmwasm_std::{attr, from_binary};

use crate::{
    contract::{execute, query},
    messages::{execute::ExecuteMsg, query::QueryMsg, response::CountResponse},
    tests::helpers::{get_instance, ADDR1, VALUE1, VALUE2},
};

#[test]
fn test_init() {
    let (_, _, _, res) = get_instance(VALUE1, ADDR1);

    assert_eq!(
        res.unwrap().attributes,
        vec![
            attr("method", "instantiate"),
            attr("owner", ADDR1.to_string()),
            attr("count", VALUE1.to_string())
        ]
    )
}

#[test]
fn test_set() {
    let (mut deps, env, info, _) = get_instance(VALUE1, ADDR1);
    let msg = ExecuteMsg::Set { count: VALUE2 };
    let res = execute(deps.as_mut(), env, info, msg);

    assert_eq!(
        res.unwrap().attributes,
        vec![
            attr("method", "set"),
            attr("owner", ADDR1.to_string()),
            attr("count", VALUE2.to_string())
        ]
    )
}

#[test]
fn test_query() {
    let (deps, env, _, _) = get_instance(VALUE1, ADDR1);
    let msg = QueryMsg::GetCount {};
    let bin = query(deps.as_ref(), env, msg).unwrap();
    let res = from_binary::<CountResponse>(&bin).unwrap();

    assert_eq!(res.count, VALUE1);
}
