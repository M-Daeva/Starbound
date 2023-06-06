use cosmwasm_std::{
    coin, Addr, Attribute, DepsMut, Empty, Env, Reply, Response, StdError, StdResult, SubMsgResult,
};
use cw_multi_test::{App, ContractWrapper, Executor};

fn handle_reply(_deps: DepsMut, _env: Env, msg: Reply) -> StdResult<Response> {
    match msg.result {
        SubMsgResult::Ok(_) => Ok(Response::default()
            .add_attributes(vec![("method", "reply"), ("msg_id", &msg.id.to_string())])),
        SubMsgResult::Err(e) => Err(StdError::GenericErr { msg: e }),
    }
}

#[test]
fn create_pair_of_coins() {
    const FUNDS_AMOUNT: u128 = 1_000;
    const DENOM_COIN1: &str = "ucoin1";
    const DENOM_COIN2: &str = "ucoin2";
    const DECIMALS: u8 = 6;
    const ADDR_ADMIN: &str = "wasm1admin";

    // init app contract, id = 1, address = contract0
    let mut app = App::new(|router, _api, storage| {
        router
            .bank
            .init_balance(
                storage,
                &Addr::unchecked(ADDR_ADMIN),
                vec![
                    coin(FUNDS_AMOUNT, DENOM_COIN1),
                    coin(FUNDS_AMOUNT, DENOM_COIN2),
                ],
            )
            .unwrap();
    });

    let app_id = app.store_code(Box::new(ContractWrapper::new(
        crate::contract::execute,
        crate::contract::instantiate,
        crate::contract::query,
    )));

    let _app_address = app
        .instantiate_contract(
            app_id,
            Addr::unchecked(ADDR_ADMIN),
            &Empty {},
            &[],
            "app",
            Some(ADDR_ADMIN.to_string()),
        )
        .unwrap();

    // init cw20_base contract for LP token, id = 2
    let cw20_token_id = app.store_code(Box::new(ContractWrapper::new(
        cw20_base::contract::instantiate,
        cw20_base::contract::instantiate,
        cw20_base::contract::query,
    )));

    // store pair contract, id = 3
    let pair_id = app.store_code(Box::new(
        ContractWrapper::new(
            terraswap_pair::contract::execute,
            terraswap_pair::contract::instantiate,
            terraswap_pair::contract::query,
        )
        .with_reply(handle_reply),
    ));

    // init factory contract, id = 4, address = contract1
    let factory_id = app.store_code(Box::new(
        ContractWrapper::new(
            terraswap_factory::contract::execute,
            terraswap_factory::contract::instantiate,
            terraswap_factory::contract::query,
        )
        .with_reply(handle_reply),
    ));

    let factory_address = app
        .instantiate_contract(
            factory_id,
            Addr::unchecked(ADDR_ADMIN),
            &terraswap::factory::InstantiateMsg {
                pair_code_id: pair_id,
                token_code_id: cw20_token_id,
            },
            &[],
            "factory",
            Some(ADDR_ADMIN.to_string()),
        )
        .unwrap();

    // add decimals
    let _res = app
        .execute_contract(
            Addr::unchecked(ADDR_ADMIN),
            factory_address.clone(),
            &terraswap::factory::ExecuteMsg::AddNativeTokenDecimals {
                denom: DENOM_COIN1.to_string(),
                decimals: DECIMALS,
            },
            &[coin(1, DENOM_COIN1)],
        )
        .unwrap();

    let _res = app
        .execute_contract(
            Addr::unchecked(ADDR_ADMIN),
            factory_address.clone(),
            &terraswap::factory::ExecuteMsg::AddNativeTokenDecimals {
                denom: DENOM_COIN2.to_string(),
                decimals: DECIMALS,
            },
            &[coin(1, DENOM_COIN2)],
        )
        .unwrap();

    // create pair
    let asset_infos = [
        terraswap::asset::AssetInfo::NativeToken {
            denom: DENOM_COIN1.to_string(),
        },
        terraswap::asset::AssetInfo::NativeToken {
            denom: DENOM_COIN2.to_string(),
        },
    ];

    let res = app
        .execute_contract(
            Addr::unchecked(ADDR_ADMIN),
            factory_address.clone(),
            &terraswap::factory::ExecuteMsg::CreatePair {
                asset_infos: asset_infos.clone(),
            },
            &[coin(10, DENOM_COIN1), coin(10, DENOM_COIN2)],
        )
        .unwrap();

    let is_pair_found = res.events.iter().any(|x| {
        x.attributes.contains(&Attribute {
            key: "pair".to_string(),
            value: format!("{}-{}", DENOM_COIN1, DENOM_COIN2),
        })
    });

    speculoos::assert_that(&is_pair_found).is_equal_to(true);

    // query pairs
    let terraswap::factory::PairsResponse { pairs } = app
        .wrap()
        .query_wasm_smart(
            factory_address.clone(),
            &terraswap::factory::QueryMsg::Pairs {
                start_after: None,
                limit: None,
            },
        )
        .unwrap();

    let received: Vec<[terraswap::asset::AssetInfo; 2]> =
        pairs.iter().map(|x| x.asset_infos.to_owned()).collect();

    let expected = vec![asset_infos];

    speculoos::assert_that(&received).is_equal_to(expected);
}

#[test]
fn create_pair_of_tokens() {
    const FUNDS_AMOUNT: u128 = 1_000;
    const TOKEN_SYMBOL_1: &str = "TKNA";
    const TOKEN_SYMBOL_2: &str = "TKNB";
    const DECIMALS: u8 = 6;
    const ADDR_ADMIN: &str = "wasm1admin";

    // init app contract, id = 1, address = contract0
    let mut app = App::default();

    let app_id = app.store_code(Box::new(ContractWrapper::new(
        crate::contract::execute,
        crate::contract::instantiate,
        crate::contract::query,
    )));

    let _app_address = app
        .instantiate_contract(
            app_id,
            Addr::unchecked(ADDR_ADMIN),
            &Empty {},
            &[],
            "app",
            Some(ADDR_ADMIN.to_string()),
        )
        .unwrap();

    // init cw20_base contract for 1st and 2nd tokens of pair and LP token
    let cw20_token_id = app.store_code(Box::new(ContractWrapper::new(
        cw20_base::contract::instantiate,
        cw20_base::contract::instantiate,
        cw20_base::contract::query,
    )));

    // id = 2, address = contract1
    let token1_address = app
        .instantiate_contract(
            cw20_token_id,
            Addr::unchecked(ADDR_ADMIN),
            &cw20_base::msg::InstantiateMsg {
                name: format!("CW20 token {}", TOKEN_SYMBOL_1),
                symbol: TOKEN_SYMBOL_1.to_string(),
                decimals: DECIMALS,
                initial_balances: vec![cw20::Cw20Coin {
                    address: ADDR_ADMIN.to_string(),
                    amount: cosmwasm_std::Uint128::from(FUNDS_AMOUNT),
                }],
                mint: None,
                marketing: None,
            },
            &[],
            TOKEN_SYMBOL_1.to_lowercase(),
            Some(ADDR_ADMIN.to_string()),
        )
        .unwrap();

    // id = 2, address = contract2
    let token2_address = app
        .instantiate_contract(
            cw20_token_id,
            Addr::unchecked(ADDR_ADMIN),
            &cw20_base::msg::InstantiateMsg {
                name: format!("CW20 token {}", TOKEN_SYMBOL_2),
                symbol: TOKEN_SYMBOL_2.to_string(),
                decimals: DECIMALS,
                initial_balances: vec![cw20::Cw20Coin {
                    address: ADDR_ADMIN.to_string(),
                    amount: cosmwasm_std::Uint128::from(FUNDS_AMOUNT),
                }],
                mint: None,
                marketing: None,
            },
            &[],
            TOKEN_SYMBOL_2.to_lowercase(),
            Some(ADDR_ADMIN.to_string()),
        )
        .unwrap();

    // store pair contract, id = 3
    let pair_id = app.store_code(Box::new(
        ContractWrapper::new(
            terraswap_pair::contract::execute,
            terraswap_pair::contract::instantiate,
            terraswap_pair::contract::query,
        )
        .with_reply(handle_reply),
    ));

    // init factory contract, id = 4, address = contract3
    let factory_id = app.store_code(Box::new(
        ContractWrapper::new(
            terraswap_factory::contract::execute,
            terraswap_factory::contract::instantiate,
            terraswap_factory::contract::query,
        )
        .with_reply(handle_reply),
    ));

    let factory_address = app
        .instantiate_contract(
            factory_id,
            Addr::unchecked(ADDR_ADMIN),
            &terraswap::factory::InstantiateMsg {
                pair_code_id: pair_id,
                token_code_id: cw20_token_id,
            },
            &[],
            "factory",
            Some(ADDR_ADMIN.to_string()),
        )
        .unwrap();

    // create pair
    let asset_infos = [
        terraswap::asset::AssetInfo::Token {
            contract_addr: token1_address.to_string(),
        },
        terraswap::asset::AssetInfo::Token {
            contract_addr: token2_address.to_string(),
        },
    ];

    let res = app
        .execute_contract(
            Addr::unchecked(ADDR_ADMIN),
            factory_address.clone(),
            &terraswap::factory::ExecuteMsg::CreatePair {
                asset_infos: asset_infos.clone(),
            },
            &[],
        )
        .unwrap();

    let is_pair_found = res.events.iter().any(|x| {
        x.attributes.contains(&Attribute {
            key: "pair".to_string(),
            value: format!("{}-{}", token1_address, token2_address),
        })
    });

    speculoos::assert_that(&is_pair_found).is_equal_to(true);

    // query pairs
    let terraswap::factory::PairsResponse { pairs } = app
        .wrap()
        .query_wasm_smart(
            factory_address.clone(),
            &terraswap::factory::QueryMsg::Pairs {
                start_after: None,
                limit: None,
            },
        )
        .unwrap();

    let received: Vec<[terraswap::asset::AssetInfo; 2]> =
        pairs.iter().map(|x| x.asset_infos.to_owned()).collect();

    let expected = vec![asset_infos];

    speculoos::assert_that(&received).is_equal_to(expected);
}

// #[test]
// fn query_pairs_default() {
//     let mut prj = Project::new(None);
//     // let user = Project::get_user(UserName::Alice);

//     prj.create_factory().unwrap();

//     let asset_infos = [
//         AssetInfo::NativeToken {
//             denom: DENOM_DENOM.to_string(),
//         },
//         AssetInfo::NativeToken {
//             denom: DENOM_NORIA.to_string(),
//         },
//     ];

//     //println!("{:#?}", prj.query_balances(ADDR_ADMIN).unwrap());

//     // prj.add_decimals(DENOM_DENOM, 6).unwrap();
//     // prj.add_decimals(DENOM_NORIA, 6).unwrap();

//     prj.create_pair(asset_infos).unwrap();

//     // let res = prj.query_dex().unwrap();

//     // assert_eq!(res.pairs, vec![]);
// }

// #[test]
// fn deposit() {
//     let mut prj = Project::new(None);
//     let user = Project::get_user(UserName::Alice);

//     prj.deposit(
//         ADDR_ALICE_OSMO,
//         &user.asset_list,
//         user.is_rebalancing_used,
//         user.down_counter,
//         &[coin(user.deposited.u128(), DENOM_EEUR)],
//     )
//     .unwrap();

//     let res = prj.query_user(ADDR_ALICE_OSMO);

//     assert_eq!(res.unwrap(), user);
// }

// #[test]
// fn deposit_multiple_times_and_without_assets() {
//     let mut prj = Project::new(None);
//     let mut user = Project::get_user(UserName::Alice);

//     prj.deposit(
//         ADDR_ALICE_OSMO,
//         &user.asset_list,
//         user.is_rebalancing_used,
//         user.down_counter,
//         &[coin(FUNDS_AMOUNT / 10, DENOM_EEUR)],
//     )
//     .unwrap();

//     prj.deposit(
//         ADDR_ALICE_OSMO,
//         &user.asset_list,
//         user.is_rebalancing_used,
//         user.down_counter,
//         &[coin(FUNDS_AMOUNT / 10, DENOM_EEUR)],
//     )
//     .unwrap();

//     let res = prj.query_user(ADDR_ALICE_OSMO);

//     user.deposited = Uint128::from(2 * FUNDS_AMOUNT / 10);

//     assert_eq!(res.unwrap(), user.clone());

//     prj.deposit(
//         ADDR_ALICE_OSMO,
//         &vec![],
//         user.is_rebalancing_used,
//         user.down_counter,
//         &[coin(FUNDS_AMOUNT / 10, DENOM_EEUR)],
//     )
//     .unwrap();

//     let res = prj.query_user(ADDR_ALICE_OSMO);

//     user.deposited = Uint128::from(3 * FUNDS_AMOUNT / 10);

//     assert_eq!(res.unwrap(), user);
// }

// #[test]
// fn deposit_unsupported_asset() {
//     let mut prj = Project::new(None);
//     let user = Project::get_user(UserName::Alice);

//     let res = prj
//         .deposit(
//             ADDR_ALICE_OSMO,
//             &user.asset_list,
//             user.is_rebalancing_used,
//             user.down_counter,
//             &[coin(user.deposited.u128(), DENOM_OSMO)],
//         )
//         .unwrap_err();

//     assert_eq!(&res.to_string(), "Overflow: Cannot Sub with 0 and 10000")
// }

// // check if asset outside pool list can not be deposited (excluding native asset)
// #[test]
// fn deposit_non_pool_asset_native() {
//     let mut prj = Project::new(None);
//     let mut user = Project::get_user(UserName::Alice);
//     user.asset_list.push(Asset::new(
//         DENOM_OSMO,
//         &Addr::unchecked(ADDR_ALICE_OSMO),
//         Uint128::zero(),
//         u128_to_dec(0_u128),
//         Uint128::zero(),
//     ));

//     prj.deposit(
//         ADDR_ALICE_OSMO,
//         &user.asset_list,
//         user.is_rebalancing_used,
//         user.down_counter,
//         &[coin(user.deposited.u128(), DENOM_EEUR)],
//     )
//     .unwrap();

//     let res = prj.query_user(ADDR_ALICE_OSMO);

//     assert_eq!(res.unwrap(), user);
// }

// // check if asset outside pool list can not be deposited
// #[test]
// #[should_panic]
// fn deposit_non_pool_asset_scrt() {
//     let mut prj = Project::new(None);
//     let mut user = Project::get_user(UserName::Alice);
//     user.asset_list.push(Asset::new(
//         DENOM_SCRT,
//         &Addr::unchecked(ADDR_BOB_SCRT),
//         Uint128::zero(),
//         u128_to_dec(0_u128),
//         Uint128::zero(),
//     ));

//     prj.deposit(
//         ADDR_ALICE_OSMO,
//         &user.asset_list,
//         user.is_rebalancing_used,
//         user.down_counter,
//         &[coin(user.deposited.u128(), DENOM_EEUR)],
//     )
//     .unwrap();
// }

// // check if user can not has multiple addresses on same asset
// #[test]
// fn deposit_and_update_wallet_address() {
//     let mut prj = Project::new(None);
//     let mut user = Project::get_user(UserName::Alice);

//     prj.deposit(
//         ADDR_ALICE_OSMO,
//         &user.asset_list,
//         user.is_rebalancing_used,
//         user.down_counter,
//         &[coin(user.deposited.u128(), DENOM_EEUR)],
//     )
//     .unwrap();

//     // ADDR_BOB_ATOM must replace ADDR_ALICE_ATOM
//     user.asset_list[0].wallet_address = Addr::unchecked(ADDR_BOB_ATOM);

//     prj.deposit(
//         ADDR_ALICE_OSMO,
//         &user.asset_list,
//         user.is_rebalancing_used,
//         user.down_counter,
//         &[],
//     )
//     .unwrap();

//     let res = prj.query_user(ADDR_ALICE_OSMO);

//     assert_eq!(res.unwrap(), user);
// }

// // check if asset lists can be merged properly
// #[test]
// fn deposit_and_update_asset_list() {
//     let mut prj = Project::new(None);
//     let user = Project::get_user(UserName::Alice);

//     // add atom to asset list
//     let asset_list = vec![Asset::new(
//         DENOM_ATOM,
//         &Addr::unchecked(ADDR_ALICE_ATOM),
//         Uint128::zero(),
//         str_to_dec("1"),
//         Uint128::from(100_u128), // must be ignored
//     )];

//     prj.deposit(
//         ADDR_ALICE_OSMO,
//         &asset_list,
//         user.is_rebalancing_used,
//         user.down_counter,
//         &[coin(user.deposited.u128(), DENOM_EEUR)],
//     )
//     .unwrap();

//     let res = prj.query_user(ADDR_ALICE_OSMO).unwrap();
//     assert_eq!(
//         res,
//         User {
//             asset_list: vec![Asset::new(
//                 DENOM_ATOM,
//                 &Addr::unchecked(ADDR_ALICE_ATOM),
//                 Uint128::zero(),
//                 str_to_dec("1"),
//                 Uint128::zero()
//             )],
//             ..user
//         }
//     );

//     // add atom and juno to asset list and update it
//     prj.deposit(
//         ADDR_ALICE_OSMO,
//         &user.asset_list,
//         user.is_rebalancing_used,
//         user.down_counter,
//         &[],
//     )
//     .unwrap();

//     let res = prj.query_user(ADDR_ALICE_OSMO).unwrap();

//     assert_eq!(res, user);
// }

// #[test]
// fn withdraw() {
//     let mut prj = Project::new(None);
//     let user = Project::get_user(UserName::Alice);

//     prj.deposit(
//         ADDR_ALICE_OSMO,
//         &user.asset_list,
//         user.is_rebalancing_used,
//         user.down_counter,
//         &[coin(user.deposited.u128(), DENOM_EEUR)],
//     )
//     .unwrap();

//     let part_of_deposited = user.deposited.div(Uint128::from(2_u128));

//     prj.withdraw(ADDR_ALICE_OSMO, part_of_deposited).unwrap();

//     let res = prj.query_user(ADDR_ALICE_OSMO);

//     assert_eq!(
//         res.unwrap(),
//         User {
//             deposited: part_of_deposited,
//             ..user
//         }
//     );
// }

// #[test]
// #[should_panic]
// fn update_scheduler_before() {
//     let mut prj = Project::new(None);

//     let QueryPoolsAndUsersResponse {
//         pools: res_pools,
//         users: res_users,
//     } = prj.query_pools_and_users().unwrap();
// }

// #[test]
// fn update_scheduler_after() {
//     let mut prj = Project::new(None);
//     let res = prj
//         .update_config(
//             ADDR_ADMIN_OSMO,
//             Some(ADDR_BOB_OSMO.to_string()),
//             None,
//             None,
//             None,
//             None,
//             None,
//         )
//         .unwrap();

//     assert_eq!(Project::get_attr(&res, "method"), "update_config");

//     let QueryPoolsAndUsersResponse {
//         pools: res_pools,
//         users: res_users,
//     } = prj.query_pools_and_users().unwrap();
// }

// #[test]
// fn query_user() {
//     let mut prj = Project::new(None);
//     let user_alice = Project::get_user(UserName::Alice);
//     let user_bob = Project::get_user(UserName::Bob);

//     prj.deposit(
//         ADDR_ALICE_OSMO,
//         &user_alice.asset_list,
//         user_alice.is_rebalancing_used,
//         user_alice.down_counter,
//         &[coin(user_alice.deposited.u128(), DENOM_EEUR)],
//     )
//     .unwrap();
//     prj.deposit(
//         ADDR_BOB_OSMO,
//         &user_bob.asset_list,
//         user_bob.is_rebalancing_used,
//         user_bob.down_counter,
//         &[coin(user_bob.deposited.u128(), DENOM_EEUR)],
//     )
//     .unwrap();

//     let res = prj.query_user(ADDR_ALICE_OSMO).unwrap();

//     assert_eq!(res, user_alice);
// }

// #[test]
// fn query_pools_and_users() {
//     let mut prj = Project::new(None);
//     let pools = Project::get_pools();
//     let user_alice = Project::get_user(UserName::Alice);
//     let user_bob = Project::get_user(UserName::Bob);

//     prj.deposit(
//         ADDR_ALICE_OSMO,
//         &user_alice.asset_list,
//         user_alice.is_rebalancing_used,
//         user_alice.down_counter,
//         &[coin(user_alice.deposited.u128(), DENOM_EEUR)],
//     )
//     .unwrap();
//     prj.deposit(
//         ADDR_BOB_OSMO,
//         &user_bob.asset_list,
//         user_bob.is_rebalancing_used,
//         user_bob.down_counter,
//         &[coin(user_bob.deposited.u128(), DENOM_EEUR)],
//     )
//     .unwrap();

//     let QueryPoolsAndUsersResponse {
//         pools: res_pools,
//         users: res_users,
//     } = prj.query_pools_and_users().unwrap();

//     assert_eq!(
//         res_pools
//             .iter()
//             .map(|(_denom, pool)| pool.to_owned())
//             .collect::<Vec<Pool>>(),
//         pools
//     );

//     let assets_received = res_users
//         .iter()
//         .map(|(_addr, user)| user.asset_list.to_owned())
//         .collect::<Vec<Vec<Asset>>>();

//     // user order matters!
//     let assets_initial = vec![user_bob, user_alice]
//         .iter()
//         .map(|x| x.asset_list.to_owned())
//         .collect::<Vec<Vec<Asset>>>();

//     assert_eq!(assets_received, assets_initial)
// }

// #[test]
// fn update_pools_and_users() {
//     // initialize
//     let mut prj = Project::new(None);
//     let user_alice = Project::get_user(UserName::Alice);
//     let user_bob = Project::get_user(UserName::Bob);

//     prj.deposit(
//         ADDR_ALICE_OSMO,
//         &user_alice.asset_list,
//         user_alice.is_rebalancing_used,
//         user_alice.down_counter,
//         &[coin(user_alice.deposited.u128(), DENOM_EEUR)],
//     )
//     .unwrap();
//     prj.deposit(
//         ADDR_BOB_OSMO,
//         &user_bob.asset_list,
//         user_bob.is_rebalancing_used,
//         user_bob.down_counter,
//         &[coin(user_bob.deposited.u128(), DENOM_EEUR)],
//     )
//     .unwrap();

//     // request data
//     let QueryPoolsAndUsersResponse {
//         pools: res_pools,
//         users: res_users,
//     } = prj.query_pools_and_users().unwrap();

//     // update data
//     let pools_updated = res_pools
//         .iter()
//         .map(|(denom, pool)| {
//             (
//                 denom.to_owned(),
//                 Pool {
//                     price: pool.price.add(Decimal::one()),
//                     ..pool.to_owned()
//                 },
//             )
//         })
//         .collect::<Vec<(Denom, Pool)>>();

//     let users_updated = res_users
//         .iter()
//         .map(|(addr, user)| {
//             (
//                 addr.to_owned(),
//                 User {
//                     asset_list: user
//                         .asset_list
//                         .iter()
//                         .map(|y| Asset {
//                             wallet_balance: y.wallet_balance.add(Uint128::from(500_u128)),
//                             ..y.to_owned()
//                         })
//                         .collect::<Vec<Asset>>(),
//                     ..user.to_owned()
//                 },
//             )
//         })
//         .collect::<Vec<(Addr, User)>>();

//     // check changes
//     let QueryPoolsAndUsersResponse {
//         pools: res_pools_updated,
//         users: res_users_updated,
//     } = prj.query_pools_and_users().unwrap();

//     assert_eq!(res_pools_updated, pools_updated);
//     assert_eq!(res_users_updated, users_updated);
// }

// // check if asset outside pool list can not be added
// #[test]
// fn update_pools_and_users_unsupported_asset() {
//     // initialize
//     let mut prj = Project::new(None);
//     let user_alice = Project::get_user(UserName::Alice);
//     let user_bob = Project::get_user(UserName::Bob);

//     prj.deposit(
//         ADDR_ALICE_OSMO,
//         &user_alice.asset_list,
//         user_alice.is_rebalancing_used,
//         user_alice.down_counter,
//         &[coin(user_alice.deposited.u128(), DENOM_EEUR)],
//     )
//     .unwrap();
//     prj.deposit(
//         ADDR_BOB_OSMO,
//         &user_bob.asset_list,
//         user_bob.is_rebalancing_used,
//         user_bob.down_counter,
//         &[coin(user_bob.deposited.u128(), DENOM_EEUR)],
//     )
//     .unwrap();

//     // request data
//     let QueryPoolsAndUsersResponse {
//         pools: res_pools,
//         users: res_users,
//     } = prj.query_pools_and_users().unwrap();

//     // update data
//     let mut users_updated = res_users.clone();
//     users_updated[0].1.asset_list.push(Asset::new(
//         DENOM_SCRT,
//         &Addr::unchecked(ADDR_BOB_SCRT),
//         Uint128::zero(),
//         Decimal::one(),
//         Uint128::zero(),
//     ));

//     // check changes
//     let QueryPoolsAndUsersResponse {
//         pools: _res_pools_updated,
//         users: res_users_updated,
//     } = prj.query_pools_and_users().unwrap();

//     assert_eq!(res_users_updated, res_users);
// }
