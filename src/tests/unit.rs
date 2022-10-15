// use cosmwasm_std::{attr, coin, from_binary, Addr};

// use crate::{
//     actions::helpers::Denoms,
//     contract::{execute, query},
//     messages::{
//         execute::ExecuteMsg,
//         query::QueryMsg,
//         response::{
//             GetAllDenomsResponse, GetAllPoolsResponse, GetDenomResponse, GetUserInfoResponse,
//         },
//     },
//     tests::helpers::{
//         get_instance, instantiate_and_deposit, ADDR_ALICE, ADDR_ALICE_WASM, ADDR_BOB,
//         ASSETS_AMOUNT_INITIAL, CHANNEL_ID, FUNDS_AMOUNT, IS_CONTROLLED_REBALANCING,
//         IS_CURRENT_PERIOD, POOLS_AMOUNT_INITIAL, SYMBOL_TOKEN_IN, SYMBOL_TOKEN_NONEX,
//         SYMBOL_TOKEN_OUT,
//     },
// };

// #[test]
// fn test_init() {
//     let (_, _, _, res) = get_instance(ADDR_ALICE);

//     assert_eq!(
//         res.unwrap().attributes,
//         vec![
//             attr("method", "instantiate"),
//             attr("admin", ADDR_ALICE),
//             attr("scheduler", ADDR_ALICE),
//             attr("pools_amount", POOLS_AMOUNT_INITIAL),
//             attr("assets_amount", ASSETS_AMOUNT_INITIAL),
//         ]
//     )
// }

// #[test]
// fn test_execute_deposit() {
//     let (_, _, _, res) =
//         instantiate_and_deposit(IS_CONTROLLED_REBALANCING, IS_CURRENT_PERIOD, FUNDS_AMOUNT);

//     let user_deposited_on_current_period = if IS_CURRENT_PERIOD { FUNDS_AMOUNT } else { 0 };
//     let user_deposited_on_next_period = if !IS_CURRENT_PERIOD { FUNDS_AMOUNT } else { 0 };

//     assert_eq!(
//         res.unwrap().attributes,
//         vec![
//             attr("method", "deposit"),
//             attr("user_address", ADDR_ALICE),
//             attr(
//                 "user_deposited_on_current_period",
//                 user_deposited_on_current_period.to_string()
//             ),
//             attr(
//                 "user_deposited_on_next_period",
//                 user_deposited_on_next_period.to_string()
//             ),
//         ]
//     )
// }

// #[test]
// fn test_execute_swap_tokens() {
//     let (mut deps, env, info, _res) =
//         instantiate_and_deposit(IS_CONTROLLED_REBALANCING, IS_CURRENT_PERIOD, FUNDS_AMOUNT);

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

// #[test]
// fn test_execute_ibc_transfer() {
//     let (mut deps, env, info, _res) =
//         instantiate_and_deposit(IS_CONTROLLED_REBALANCING, IS_CURRENT_PERIOD, FUNDS_AMOUNT);

//     let msg = ExecuteMsg::Transfer {
//         receiver_addr: ADDR_ALICE_WASM.to_string(),
//         channel_id: CHANNEL_ID.to_string(),
//         token_amount: (FUNDS_AMOUNT / 10),
//         token_symbol: SYMBOL_TOKEN_IN.to_string(),
//     };

//     let res = execute(deps.as_mut(), env, info, msg);

//     assert_eq!(
//         res.unwrap().attributes,
//         vec![
//             attr("method", "transfer"),
//             attr("receiver_addr", ADDR_ALICE_WASM),
//             attr("channel_id", CHANNEL_ID),
//             attr("token_amount", &(FUNDS_AMOUNT / 10).to_string()),
//             attr("token_symbol", SYMBOL_TOKEN_IN),
//         ]
//     )
// }

// #[test]
// fn test_query_get_denom() {
//     let denom_token_out = Denoms::get(SYMBOL_TOKEN_OUT).unwrap();

//     let (deps, env, _, _) = get_instance(ADDR_ALICE);
//     let msg = QueryMsg::GetDenom {
//         asset_symbol: SYMBOL_TOKEN_OUT.to_string(),
//     };
//     let bin = query(deps.as_ref(), env, msg).unwrap();
//     let res = from_binary::<GetDenomResponse>(&bin).unwrap();

//     assert_eq!(res.denom, denom_token_out);
// }

// #[test]
// fn test_query_get_nonexistent_denom() {
//     let (deps, env, _, _) = get_instance(ADDR_ALICE);
//     let msg = QueryMsg::GetDenom {
//         asset_symbol: SYMBOL_TOKEN_NONEX.to_string(),
//     };
//     let bin = query(deps.as_ref(), env, msg);

//     bin.unwrap_err();
// }

// #[test]
// fn test_query_get_all_denoms() {
//     let (deps, env, _, _) = get_instance(ADDR_ALICE);
//     let msg = QueryMsg::GetAllDenoms {};
//     let bin = query(deps.as_ref(), env, msg).unwrap();
//     let res = from_binary::<GetAllDenomsResponse>(&bin).unwrap();

//     assert_eq!(
//         res.all_assets_info.len(),
//         ASSETS_AMOUNT_INITIAL.parse::<usize>().unwrap()
//     );
// }

// #[test]
// fn test_query_get_all_pools() {
//     let (deps, env, _, _) = get_instance(ADDR_ALICE);
//     let msg = QueryMsg::GetAllPools {};
//     let bin = query(deps.as_ref(), env, msg).unwrap();
//     let res = from_binary::<GetAllPoolsResponse>(&bin).unwrap();

//     assert_eq!(
//         res.all_pools.len(),
//         POOLS_AMOUNT_INITIAL.parse::<usize>().unwrap()
//     );
// }

// #[test]
// fn test_query_get_user_info() {
//     let funds_denom = &Denoms::get(SYMBOL_TOKEN_IN).unwrap();

//     let (mut deps, env, mut info, _) = get_instance(ADDR_ALICE);
//     let msg = ExecuteMsg::Deposit {
//         is_controlled_rebalancing: IS_CONTROLLED_REBALANCING,
//         is_current_period: IS_CURRENT_PERIOD,
//     };
//     info.funds = vec![coin(FUNDS_AMOUNT, funds_denom)];
//     info.sender = Addr::unchecked(ADDR_BOB);
//     let _res = execute(deps.as_mut(), env.clone(), info, msg);

//     let msg = QueryMsg::GetUserInfo {
//         address: ADDR_BOB.to_string(),
//     };
//     let bin = query(deps.as_ref(), env, msg).unwrap();
//     let res = from_binary::<GetUserInfoResponse>(&bin).unwrap();

//     assert_eq!(res.deposited_on_current_period, FUNDS_AMOUNT);
// }
