use crate::{
    error::ContractError,
    state::User,
    tests::{
        builders::*,
        suite::{Project, ProjectAccount, ProjectCoin, ProjectToken},
    },
};

#[test]
fn deposit_with_missing_parameters() {
    let mut project = Project::new(None);
    project
        // deposit without any parameters
        .prepare_deposit_by(ProjectAccount::Alice)
        .execute_and_switch_to(&mut project)
        .assert_error(ContractError::NewUserRequirements {})
        // deposit only with funds
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_funds(100, ProjectCoin::Denom)
        .execute_and_switch_to(&mut project)
        .assert_error(ContractError::NewUserRequirements {})
        // deposit only with funds and asset
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_funds(100, ProjectCoin::Denom)
        .with_asset(ProjectToken::Atom, "1")
        .execute_and_switch_to(&mut project)
        .assert_error(ContractError::NewUserRequirements {})
        // deposit only with funds and down_counter
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_funds(100, ProjectCoin::Denom)
        .with_down_counter(10)
        .execute_and_switch_to(&mut project)
        .assert_error(ContractError::NewUserRequirements {});
}

#[test]
fn deposit_default() {
    let mut project = Project::new(None);
    project
        // deposit with all parameters
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_funds(100, ProjectCoin::Denom)
        .with_asset(ProjectCoin::Noria, "0.6")
        .with_asset(ProjectToken::Atom, "0.4")
        .with_rebalancing(true)
        .with_down_counter(10)
        .execute_and_switch_to(&mut project)
        .query_users(&[])
        .assert_user(
            User::prepare()
                .with_funds(100, ProjectCoin::Denom)
                .with_asset(ProjectCoin::Noria, "0.6")
                .with_asset(ProjectToken::Atom, "0.4")
                .with_rebalancing(true)
                .with_down_counter(10)
                .complete_with_name(ProjectAccount::Alice),
        );
}

#[test]
fn deposit_and_update_parameters() {
    let mut project = Project::new(None);
    project
        // deposit only with necessary parameters
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_asset(ProjectToken::Atom, "1")
        .with_down_counter(10)
        .execute_and_switch_to(&mut project)
        .query_users(&[])
        .assert_user(
            User::prepare()
                .with_asset(ProjectToken::Atom, "1")
                .with_rebalancing(false)
                .with_down_counter(10)
                .complete_with_name(ProjectAccount::Alice),
        )
        // update assets
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_asset(ProjectCoin::Noria, "1")
        .execute_and_switch_to(&mut project)
        .query_users(&[])
        .assert_user(
            User::prepare()
                .with_asset(ProjectCoin::Noria, "1")
                .with_rebalancing(false)
                .with_down_counter(10)
                .complete_with_name(ProjectAccount::Alice),
        )
        // update down counter
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_down_counter(5)
        .execute_and_switch_to(&mut project)
        .query_users(&[])
        .assert_user(
            User::prepare()
                .with_asset(ProjectCoin::Noria, "1")
                .with_rebalancing(false)
                .with_down_counter(5)
                .complete_with_name(ProjectAccount::Alice),
        )
        // update rebalancing
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_rebalancing(true)
        .execute_and_switch_to(&mut project)
        .query_users(&[])
        .assert_user(
            User::prepare()
                .with_asset(ProjectCoin::Noria, "1")
                .with_rebalancing(true)
                .with_down_counter(5)
                .complete_with_name(ProjectAccount::Alice),
        )
        // add funds
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_funds(100, ProjectCoin::Denom)
        .execute_and_switch_to(&mut project)
        .query_users(&[])
        .assert_user(
            User::prepare()
                .with_funds(100, ProjectCoin::Denom)
                .with_asset(ProjectCoin::Noria, "1")
                .with_rebalancing(true)
                .with_down_counter(5)
                .complete_with_name(ProjectAccount::Alice),
        )
        // update funds
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_funds(100, ProjectCoin::Denom)
        .execute_and_switch_to(&mut project)
        .query_users(&[])
        .assert_user(
            User::prepare()
                .with_funds(200, ProjectCoin::Denom)
                .with_asset(ProjectCoin::Noria, "1")
                .with_rebalancing(true)
                .with_down_counter(5)
                .complete_with_name(ProjectAccount::Alice),
        );
}

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
