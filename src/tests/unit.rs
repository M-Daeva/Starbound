use cosmwasm_std::{attr, coin, from_binary, Addr, Attribute, Decimal, Empty, StdError, Uint128};

use cw_multi_test::{App, Contract, ContractWrapper, Executor};
use osmosis_testing::{
    cosmrs::proto::cosmos::bank::v1beta1::QueryAllBalancesRequest, fn_query, Account, Bank, Gamm,
    Module, OsmosisTestApp, Wasm,
};
use std::ops::{Add, Div};

use crate::{
    actions::rebalancer::str_to_dec,
    contract::{execute, instantiate, query},
    error::ContractError,
    messages::{
        execute::ExecuteMsg,
        instantiate::InstantiateMsg,
        query::QueryMsg,
        response::{QueryLedgerResponse, QueryPoolsAndUsersResponse, QueryUserResponse},
    },
    state::{Asset, AssetExtracted, Pool, PoolExtracted, User, UserExtracted},
    tests::helpers::{
        Starbound, UserName, ADDR_ADMIN_OSMO, ADDR_ALICE_ATOM, ADDR_ALICE_JUNO, ADDR_ALICE_OSMO,
        ADDR_BOB_ATOM, ADDR_BOB_JUNO, ADDR_BOB_OSMO, DENOM_ATOM, DENOM_EEUR, DENOM_JUNO,
        DENOM_OSMO, FUNDS_AMOUNT, IS_CONTROLLED_REBALANCING, IS_CURRENT_PERIOD,
    },
};

// TODO: check if asset outside pool list can not be deposited
#[test]
fn deposit() {
    let mut st = Starbound::new();
    let user = Starbound::get_user(UserName::Alice);

    st.deposit(
        ADDR_ALICE_OSMO,
        &user,
        &[coin(user.deposited.u128(), DENOM_EEUR)],
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
        &[coin(user.deposited.u128(), DENOM_EEUR)],
    )
    .unwrap();

    // ADDR_BOB_ATOM must replace ADDR_ALICE_ATOM
    user.asset_list[0].wallet_address = Addr::unchecked(ADDR_BOB_ATOM);

    st.deposit(
        ADDR_ALICE_OSMO,
        &User {
            deposited: Uint128::zero(),
            ..user.clone()
        },
        &[],
    )
    .unwrap();

    let res = st.query_user(ADDR_ALICE_OSMO);

    assert_eq!(res.unwrap().user, user);
}

// check if asset lists can be merged properly
#[test]
fn deposit_and_update_asset_list() {
    let mut st = Starbound::new();
    let user = Starbound::get_user(UserName::Alice);

    // add atom to asset list
    let asset_list = vec![Asset::new(
        DENOM_ATOM,
        &Addr::unchecked(ADDR_ALICE_ATOM),
        Uint128::zero(),
        str_to_dec("1"),
        Uint128::from(100_u128), // must be ignored
    )];

    st.deposit(
        ADDR_ALICE_OSMO,
        &User { asset_list, ..user },
        &[coin(user.deposited.u128(), DENOM_EEUR)],
    )
    .unwrap();

    let res = st.query_user(ADDR_ALICE_OSMO).unwrap();
    assert_eq!(
        res.user,
        User {
            asset_list: vec![Asset::new(
                DENOM_ATOM,
                &Addr::unchecked(ADDR_ALICE_ATOM),
                Uint128::zero(),
                str_to_dec("1"),
                Uint128::zero()
            )],
            ..user
        }
    );

    // add atom and juno to asset list and update it
    st.deposit(
        ADDR_ALICE_OSMO,
        &User {
            deposited: Uint128::zero(),
            ..user.to_owned()
        },
        &[],
    )
    .unwrap();

    let res = st.query_user(ADDR_ALICE_OSMO).unwrap();

    assert_eq!(res.user, user);
}

#[test]
fn withdraw() {
    let mut st = Starbound::new();
    let user = Starbound::get_user(UserName::Alice);

    st.deposit(
        ADDR_ALICE_OSMO,
        &user,
        &[coin(user.deposited.u128(), DENOM_EEUR)],
    )
    .unwrap();

    let part_of_deposited = user.deposited.div(Uint128::from(2_u128));

    st.withdraw(ADDR_ALICE_OSMO, part_of_deposited).unwrap();

    let res = st.query_user(ADDR_ALICE_OSMO);

    assert_eq!(
        res.unwrap().user,
        User {
            deposited: part_of_deposited,
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
    let res = st
        .update_config(
            ADDR_ADMIN_OSMO,
            Some(ADDR_BOB_OSMO.to_string()),
            None,
            None,
            None,
            None,
        )
        .unwrap();

    assert_eq!(Starbound::get_attr(&res, "method"), "update_config");

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
        &[coin(user_alice.deposited.u128(), DENOM_EEUR)],
    )
    .unwrap();
    st.deposit(
        ADDR_BOB_OSMO,
        &user_bob,
        &[coin(user_bob.deposited.u128(), DENOM_EEUR)],
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
        &[coin(user_alice.deposited.u128(), DENOM_EEUR)],
    )
    .unwrap();
    st.deposit(
        ADDR_BOB_OSMO,
        &user_bob,
        &[coin(user_bob.deposited.u128(), DENOM_EEUR)],
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

// TODO: check if asset outside pool list can not be added
#[test]
fn update_pools_and_users() {
    // initialize
    let mut st = Starbound::new();
    let user_alice = Starbound::get_user(UserName::Alice);
    let user_bob = Starbound::get_user(UserName::Bob);

    st.deposit(
        ADDR_ALICE_OSMO,
        &user_alice,
        &[coin(user_alice.deposited.u128(), DENOM_EEUR)],
    )
    .unwrap();
    st.deposit(
        ADDR_BOB_OSMO,
        &user_bob,
        &[coin(user_bob.deposited.u128(), DENOM_EEUR)],
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

#[test]
fn swap() {
    // create new osmosis appchain instance
    let app = OsmosisTestApp::new();

    // create new accounts with initial funds
    let accs = app
        .init_accounts(
            &[
                coin(1_000_000_000_000_000, DENOM_ATOM),
                coin(1_000_000_000_000_000, DENOM_JUNO),
                coin(1_000_000_000_000_000, DENOM_EEUR),
                coin(1_000_000_000_000_000, DENOM_OSMO),
            ],
            2,
        )
        .unwrap();

    let admin = &accs[0];
    let user = &accs[1];

    // create Gamm Module Wrapper
    let gamm = Gamm::new(&app);

    // create balancer pool with basic configuration
    // ATOM pool_id is 1, 1 ATOM == 12.5 OSMO
    let pool_liquidity = vec![coin(1_000_000, DENOM_ATOM), coin(12_500_000, DENOM_OSMO)];
    gamm.create_basic_pool(&pool_liquidity, user).unwrap();

    // JUNO pool_id is 2, 1 JUNO == 2.5 OSMO
    let pool_liquidity = vec![coin(1_000_000, DENOM_JUNO), coin(2_500_000, DENOM_OSMO)];
    gamm.create_basic_pool(&pool_liquidity, user).unwrap();

    // EEUR pool_id is 3, 1 EEUR == 1.25 OSMO
    const STABLE_POOL_ID: u64 = 3;
    let pool_liquidity = vec![coin(1_000_000, DENOM_EEUR), coin(1_250_000, DENOM_OSMO)];
    gamm.create_basic_pool(&pool_liquidity, user).unwrap();

    // `Wasm` is the module we use to interact with cosmwasm releated logic on the appchain
    let wasm = Wasm::new(&app);

    // create Bank Module Wrapper
    let bank = Bank::new(&app);

    // Load compiled wasm bytecode
    let wasm_byte_code = std::fs::read("./artifacts/starbound.wasm").unwrap();
    let code_id = wasm
        .store_code(&wasm_byte_code, None, admin)
        .unwrap()
        .data
        .code_id;

    // instantiate contract
    let contract_addr = wasm
        .instantiate(
            code_id,
            &InstantiateMsg {},
            Some(&admin.address()),
            None,
            &[],
            admin,
        )
        .unwrap()
        .data
        .address;

    // query contract state to check if contract instantiation works properly
    let QueryPoolsAndUsersResponse { pools, .. } = wasm
        .query::<QueryMsg, QueryPoolsAndUsersResponse>(
            &contract_addr,
            &QueryMsg::QueryPoolsAndUsers {},
        )
        .unwrap();

    // prepare pool ids for gamm wrapper
    wasm.execute::<ExecuteMsg>(
        &contract_addr,
        &ExecuteMsg::UpdatePoolsAndUsers {
            pools: pools
                .iter()
                .enumerate()
                .map(|(i, x)| PoolExtracted {
                    id: Uint128::from(i as u128) + Uint128::one(),
                    ..x.to_owned()
                })
                .collect::<Vec<PoolExtracted>>(),
            users: vec![],
        },
        &[],
        admin,
    )
    .unwrap();

    // update stablecoin pool id for gamm wrapper
    wasm.execute::<ExecuteMsg>(
        &contract_addr,
        &ExecuteMsg::UpdateConfig {
            scheduler: None,
            stablecoin_denom: Some(DENOM_EEUR.to_string()),
            stablecoin_pool_id: Some(STABLE_POOL_ID),
            fee_default: None,
            fee_osmo: None,
        },
        &[],
        admin,
    )
    .unwrap();

    let user_alice = Starbound::get_user(UserName::Alice);

    wasm.execute::<ExecuteMsg>(
        &contract_addr,
        &ExecuteMsg::Deposit {
            user: user_alice.clone(),
        },
        &[coin(user_alice.deposited.u128(), DENOM_EEUR)],
        user,
    )
    .unwrap();

    let res = gamm.query_pool(STABLE_POOL_ID).unwrap();
    println!("{:#?}", res.pool_assets);

    let contract_balances = bank
        .query_all_balances(&QueryAllBalancesRequest {
            address: contract_addr.clone(),
            pagination: None,
        })
        .unwrap();
    println!("{:#?}", contract_balances);

    let ledger = wasm
        .query::<QueryMsg, QueryLedgerResponse>(&contract_addr, &QueryMsg::QueryLedger {})
        .unwrap();
    println!("{:#?}", ledger);

    wasm.execute::<ExecuteMsg>(&contract_addr, &ExecuteMsg::Swap {}, &[], admin)
        .unwrap();

    let res = gamm.query_pool(STABLE_POOL_ID).unwrap();
    println!("{:#?}", res.pool_assets);

    let contract_balances = bank
        .query_all_balances(&QueryAllBalancesRequest {
            address: contract_addr.clone(),
            pagination: None,
        })
        .unwrap();
    println!("{:#?}", contract_balances);

    let ledger = wasm
        .query::<QueryMsg, QueryLedgerResponse>(&contract_addr, &QueryMsg::QueryLedger {})
        .unwrap();
    println!("{:#?}", ledger);
}

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
