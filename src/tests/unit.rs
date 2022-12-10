use cosmwasm_std::{attr, coin, from_binary, Addr, Attribute, Decimal, Empty, StdError, Uint128};
use cw_multi_test::{App, Contract, ContractWrapper, Executor};
use std::ops::{Add, Div};

use crate::{
    actions::rebalancer::str_to_dec,
    contract::{execute, instantiate, query},
    error::ContractError,
    messages::{
        execute::ExecuteMsg,
        query::QueryMsg,
        response::{QueryPoolsAndUsersResponse, QueryUserResponse},
    },
    state::{Asset, AssetExtracted, Pool, PoolExtracted, User, UserExtracted},
    tests::helpers::{
        Starbound, UserName, ADDR_ADMIN_OSMO, ADDR_ALICE_ATOM, ADDR_ALICE_JUNO, ADDR_ALICE_OSMO,
        ADDR_BOB_ATOM, ADDR_BOB_JUNO, ADDR_BOB_OSMO, CHANNEL_ID, DENOM_ATOM, DENOM_EEUR,
        DENOM_JUNO, FUNDS_AMOUNT, IS_CONTROLLED_REBALANCING, IS_CURRENT_PERIOD,
        POOLS_AMOUNT_INITIAL,
    },
};

#[test]
fn deposit() {
    let mut st = Starbound::new();
    let user = Starbound::get_user(UserName::Alice);

    st.deposit(
        ADDR_ALICE_OSMO,
        &user,
        &[coin(
            user.deposited_on_current_period
                .add(user.deposited_on_next_period)
                .u128(),
            DENOM_EEUR,
        )],
    )
    .unwrap();

    let res = st.query_user(ADDR_ALICE_OSMO);

    assert_eq!(res.unwrap(), QueryUserResponse { user });
}

// check if user can not has multiple addresses on same asset
#[test]
fn deposit_and_update_wallet_address() {
    let mut st = Starbound::new();
    let mut user = Starbound::get_user(UserName::Alice);

    st.deposit(
        ADDR_ALICE_OSMO,
        &user,
        &[coin(
            user.deposited_on_current_period
                .add(user.deposited_on_next_period)
                .u128(),
            DENOM_EEUR,
        )],
    )
    .unwrap();

    // ADDR_BOB_ATOM must replace ADDR_ALICE_ATOM
    user.asset_list[0].wallet_address = Addr::unchecked(ADDR_BOB_ATOM);

    st.deposit(
        ADDR_ALICE_OSMO,
        &User {
            deposited_on_current_period: Uint128::zero(),
            deposited_on_next_period: Uint128::zero(),
            ..user.clone()
        },
        &[],
    )
    .unwrap();

    let res = st.query_user(ADDR_ALICE_OSMO);

    assert_eq!(res.unwrap().user, user);
}

#[test]
fn withdraw() {
    let mut st = Starbound::new();
    let user = Starbound::get_user(UserName::Alice);

    st.deposit(
        ADDR_ALICE_OSMO,
        &user,
        &[coin(
            user.deposited_on_current_period
                .add(user.deposited_on_next_period)
                .u128(),
            DENOM_EEUR,
        )],
    )
    .unwrap();

    let part_of_deposited_on_current_period =
        user.deposited_on_current_period.div(Uint128::from(2_u128));
    let part_of_deposited_on_next_period = user.deposited_on_next_period.div(Uint128::from(2_u128));

    st.withdraw(
        ADDR_ALICE_OSMO,
        part_of_deposited_on_current_period.add(part_of_deposited_on_next_period),
    )
    .unwrap();

    let res = st.query_user(ADDR_ALICE_OSMO);

    assert_eq!(
        res.unwrap().user,
        User {
            deposited_on_current_period: part_of_deposited_on_current_period,
            deposited_on_next_period: part_of_deposited_on_next_period,
            ..user
        }
    );
}

#[test]
#[should_panic]
fn update_scheduler_before() {
    let mut st = Starbound::new();

    let QueryPoolsAndUsersResponse {
        pools: res_pools,
        users: res_users,
    } = st.query_pools_and_users().unwrap();

    st.update_pools_and_users(ADDR_BOB_OSMO, res_pools, res_users)
        .unwrap();
}

#[test]
fn update_scheduler_after() {
    let mut st = Starbound::new();
    let res = st.update_scheduler(ADDR_ADMIN_OSMO, ADDR_BOB_OSMO).unwrap();

    assert_eq!(Starbound::get_attr(&res, "scheduler"), ADDR_BOB_OSMO);

    let QueryPoolsAndUsersResponse {
        pools: res_pools,
        users: res_users,
    } = st.query_pools_and_users().unwrap();

    st.update_pools_and_users(ADDR_BOB_OSMO, res_pools, res_users)
        .unwrap();
}

#[test]
fn query_user() {
    let mut st = Starbound::new();
    let user_alice = Starbound::get_user(UserName::Alice);
    let user_bob = Starbound::get_user(UserName::Bob);

    st.deposit(
        ADDR_ALICE_OSMO,
        &user_alice,
        &[coin(
            user_alice
                .deposited_on_current_period
                .add(user_alice.deposited_on_next_period)
                .u128(),
            DENOM_EEUR,
        )],
    )
    .unwrap();
    st.deposit(
        ADDR_BOB_OSMO,
        &user_bob,
        &[coin(
            user_bob
                .deposited_on_current_period
                .add(user_bob.deposited_on_next_period)
                .u128(),
            DENOM_EEUR,
        )],
    )
    .unwrap();

    let res = st.query_user(ADDR_ALICE_OSMO).unwrap();

    assert_eq!(res.user, user_alice);
}

#[test]
fn query_pools_and_users() {
    let mut st = Starbound::new();
    let pools = Starbound::get_pools();
    let user_alice = Starbound::get_user(UserName::Alice);
    let user_bob = Starbound::get_user(UserName::Bob);

    st.deposit(
        ADDR_ALICE_OSMO,
        &user_alice,
        &[coin(
            user_alice
                .deposited_on_current_period
                .add(user_alice.deposited_on_next_period)
                .u128(),
            DENOM_EEUR,
        )],
    )
    .unwrap();
    st.deposit(
        ADDR_BOB_OSMO,
        &user_bob,
        &[coin(
            user_bob
                .deposited_on_current_period
                .add(user_bob.deposited_on_next_period)
                .u128(),
            DENOM_EEUR,
        )],
    )
    .unwrap();

    let QueryPoolsAndUsersResponse {
        pools: res_pools,
        users: res_users,
    } = st.query_pools_and_users().unwrap();

    assert_eq!(
        res_pools.iter().map(|x| x.slice()).collect::<Vec<Pool>>(),
        pools
    );

    let assets_received = res_users
        .iter()
        .map(|x| x.asset_list.clone())
        .collect::<Vec<Vec<AssetExtracted>>>();

    // user order matters!
    let assets_initial = vec![user_bob, user_alice]
        .iter()
        .map(|x| {
            x.asset_list
                .iter()
                .map(|y| y.extract())
                .collect::<Vec<AssetExtracted>>()
        })
        .collect::<Vec<Vec<AssetExtracted>>>();

    assert_eq!(assets_received, assets_initial)
}

#[test]
fn update_pools_and_users() {
    // initialize
    let mut st = Starbound::new();
    let user_alice = Starbound::get_user(UserName::Alice);
    let user_bob = Starbound::get_user(UserName::Bob);

    st.deposit(
        ADDR_ALICE_OSMO,
        &user_alice,
        &[coin(
            user_alice
                .deposited_on_current_period
                .add(user_alice.deposited_on_next_period)
                .u128(),
            DENOM_EEUR,
        )],
    )
    .unwrap();
    st.deposit(
        ADDR_BOB_OSMO,
        &user_bob,
        &[coin(
            user_bob
                .deposited_on_current_period
                .add(user_bob.deposited_on_next_period)
                .u128(),
            DENOM_EEUR,
        )],
    )
    .unwrap();

    // request data
    let QueryPoolsAndUsersResponse {
        pools: res_pools,
        users: res_users,
    } = st.query_pools_and_users().unwrap();

    // update data
    let pools_updated = res_pools
        .iter()
        .map(|x| PoolExtracted {
            price: x.price.add(Decimal::one()),
            ..x.to_owned()
        })
        .collect::<Vec<PoolExtracted>>();

    let users_updated = res_users
        .iter()
        .map(|x| UserExtracted {
            asset_list: x
                .asset_list
                .iter()
                .map(|y| AssetExtracted {
                    wallet_balance: y.wallet_balance.add(Uint128::from(500_u128)),
                    ..y.to_owned()
                })
                .collect::<Vec<AssetExtracted>>(),
            ..x.to_owned()
        })
        .collect::<Vec<UserExtracted>>();

    st.update_pools_and_users(
        ADDR_ADMIN_OSMO,
        pools_updated.clone(),
        users_updated.clone(),
    )
    .unwrap();

    // check changes
    let QueryPoolsAndUsersResponse {
        pools: res_pools_updated,
        users: res_users_updated,
    } = st.query_pools_and_users().unwrap();

    assert_eq!(res_pools_updated, pools_updated);
    assert_eq!(res_users_updated, users_updated);
}

// // TODO: use https://github.com/osmosis-labs/osmosis-rust/tree/main/packages/osmosis-testing
// #[test]
// fn swap() {
//     let mut st = Starbound::new();
//     let user_alice = Starbound::get_user(UserName::Alice);

//     st.deposit(
//         ADDR_ALICE_OSMO,
//         &user_alice,
//         &[coin(
//             user_alice
//                 .deposited_on_current_period
//                 .add(user_alice.deposited_on_next_period)
//                 .u128(),
//             DENOM_EEUR,
//         )],
//     )
//     .unwrap();

//     let res = st.query_contract_balances().unwrap();
//     println!("res = {:#?}", res);

//     st.swap(ADDR_ADMIN_OSMO).unwrap();

//     let res = st.query_contract_balances().unwrap();
//     println!("res = {:#?}", res);
// }

// #[test]
// fn test_execute_swap_with_updated_users() {
//     let (mut deps, env, mut info, _res) =
//         instantiate_and_deposit(IS_CONTROLLED_REBALANCING, IS_CURRENT_PERIOD, FUNDS_AMOUNT);

//     // add 2nd user
//     let funds_amount = 600_000;
//     let funds_denom = DENOM_EEUR;

//     let asset_list_bob: Vec<Asset> = vec![
//         Asset {
//             asset_denom: DENOM_ATOM.to_string(),
//             wallet_address: Addr::unchecked(ADDR_BOB_ATOM),
//             wallet_balance: Uint128::from(10_000_000_u128),
//             weight: str_to_dec("0.3"),
//             amount_to_send_until_next_epoch: Uint128::zero(),
//         },
//         Asset {
//             asset_denom: DENOM_JUNO.to_string(),
//             wallet_address: Addr::unchecked(ADDR_BOB_JUNO),
//             wallet_balance: Uint128::from(10_000_000_u128),
//             weight: str_to_dec("0.7"),
//             amount_to_send_until_next_epoch: Uint128::zero(),
//         },
//     ];

//     let user = User {
//         asset_list: asset_list_bob,
//         day_counter: Uint128::from(3_u128),
//         deposited_on_current_period: Uint128::from(funds_amount),
//         deposited_on_next_period: Uint128::zero(),
//         is_controlled_rebalancing: IS_CONTROLLED_REBALANCING,
//     };

//     let msg = ExecuteMsg::Deposit { user };
//     info.funds = vec![coin(funds_amount, funds_denom)];
//     info.sender = Addr::unchecked(ADDR_BOB_OSMO);

//     let _res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

//     // update data
//     let pools: Vec<PoolExtracted> = vec![
//         PoolExtracted {
//             id: Uint128::one(),
//             denom: DENOM_ATOM.to_string(),
//             price: str_to_dec("11.5"),
//             symbol: "uatom".to_string(),
//             channel_id: CHANNEL_ID.to_string(),
//             port_id: "transfer".to_string(),
//         },
//         PoolExtracted {
//             id: Uint128::from(497_u128),
//             denom: DENOM_JUNO.to_string(),
//             price: str_to_dec("3.5"),
//             symbol: "ujuno".to_string(),
//             channel_id: CHANNEL_ID.to_string(),
//             port_id: "transfer".to_string(),
//         },
//         PoolExtracted {
//             id: Uint128::from(481_u128),
//             denom: DENOM_EEUR.to_string(),
//             price: str_to_dec("1"),
//             symbol: "debug_ueeur".to_string(),
//             channel_id: CHANNEL_ID.to_string(),
//             port_id: "transfer".to_string(),
//         },
//     ];

//     let users: Vec<UserExtracted> = vec![
//         UserExtracted {
//             osmo_address: ADDR_ALICE_OSMO.to_string(),
//             asset_list: vec![
//                 AssetExtracted {
//                     asset_denom: DENOM_ATOM.to_string(),
//                     wallet_address: ADDR_ALICE_ATOM.to_string(),
//                     wallet_balance: Uint128::one(),
//                 },
//                 AssetExtracted {
//                     asset_denom: DENOM_JUNO.to_string(),
//                     wallet_address: ADDR_ALICE_JUNO.to_string(),
//                     wallet_balance: Uint128::from(2_u128),
//                 },
//             ],
//         },
//         UserExtracted {
//             osmo_address: ADDR_BOB_OSMO.to_string(),
//             asset_list: vec![
//                 AssetExtracted {
//                     asset_denom: DENOM_ATOM.to_string(),
//                     wallet_address: ADDR_BOB_ATOM.to_string(),
//                     wallet_balance: Uint128::from(10_000_001_u128),
//                 },
//                 AssetExtracted {
//                     asset_denom: DENOM_JUNO.to_string(),
//                     wallet_address: ADDR_BOB_JUNO.to_string(),
//                     wallet_balance: Uint128::from(10_000_002_u128),
//                 },
//             ],
//         },
//     ];

//     let msg = ExecuteMsg::UpdatePoolsAndUsers { pools, users };
//     info.sender = Addr::unchecked(ADDR_ADMIN_OSMO);
//     let _res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

//     let msg = ExecuteMsg::Swap {};
//     info.sender = Addr::unchecked(ADDR_ADMIN_OSMO);
//     let res = execute(deps.as_mut(), env, info, msg);

//     assert_eq!(res.unwrap().attributes, vec![attr("method", "swap"),])
// }

// #[test]
// fn test_execute_transfer() {
//     let (mut deps, env, mut info, _res) =
//         instantiate_and_deposit(IS_CONTROLLED_REBALANCING, IS_CURRENT_PERIOD, FUNDS_AMOUNT);

//     let msg = ExecuteMsg::Swap {};
//     info.sender = Addr::unchecked(ADDR_ADMIN_OSMO);
//     let _res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

//     let msg = ExecuteMsg::Transfer {};
//     info.sender = Addr::unchecked(ADDR_ADMIN_OSMO);
//     let res = execute(deps.as_mut(), env, info, msg);

//     assert_eq!(res.unwrap().attributes, vec![attr("method", "transfer"),])
// }
