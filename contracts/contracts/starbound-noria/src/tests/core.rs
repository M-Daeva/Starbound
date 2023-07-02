use crate::{
    error::ContractError,
    state::{Config, User},
    tests::helpers::{
        builders::*,
        suite::{Project, ProjectAccount, ProjectCoin, ProjectToken},
    },
};

// #[test]
// fn deposit_with_missing_parameters() {
//     let mut project = Project::new(None);
//     project
//         // deposit without any parameters
//         .prepare_deposit_by(ProjectAccount::Alice)
//         .execute_and_switch_to(&mut project)
//         .assert_error(ContractError::NewUserRequirements {})
//         // deposit only with funds
//         .prepare_deposit_by(ProjectAccount::Alice)
//         .with_funds(100, ProjectCoin::Denom)
//         .execute_and_switch_to(&mut project)
//         .assert_error(ContractError::NewUserRequirements {})
//         // deposit only with funds and asset
//         .prepare_deposit_by(ProjectAccount::Alice)
//         .with_funds(100, ProjectCoin::Denom)
//         .with_asset(ProjectToken::Atom, "1")
//         .execute_and_switch_to(&mut project)
//         .assert_error(ContractError::NewUserRequirements {})
//         // deposit only with funds and down_counter
//         .prepare_deposit_by(ProjectAccount::Alice)
//         .with_funds(100, ProjectCoin::Denom)
//         .with_down_counter(10)
//         .execute_and_switch_to(&mut project)
//         .assert_error(ContractError::NewUserRequirements {});
// }

// #[test]
// fn deposit_default() {
//     let mut project = Project::new(None);
//     project
//         // deposit with all parameters
//         .prepare_deposit_by(ProjectAccount::Alice)
//         .with_funds(100, ProjectCoin::Denom)
//         .with_asset(ProjectCoin::Noria, "0.6")
//         .with_asset(ProjectToken::Atom, "0.4")
//         .with_rebalancing(true)
//         .with_down_counter(10)
//         .execute_and_switch_to(&mut project)
//         .query_users(&[])
//         .assert_user(
//             User::prepare()
//                 .with_funds(100, ProjectCoin::Denom)
//                 .with_asset(ProjectCoin::Noria, "0.6")
//                 .with_asset(ProjectToken::Atom, "0.4")
//                 .with_rebalancing(true)
//                 .with_down_counter(10)
//                 .complete_with_name(ProjectAccount::Alice),
//         );
// }

// #[test]
// fn query_users() {
//     let mut project = Project::new(None);
//     project
//         .prepare_deposit_by(ProjectAccount::Alice)
//         .with_funds(100, ProjectCoin::Denom)
//         .with_asset(ProjectToken::Atom, "1")
//         .with_down_counter(10)
//         .execute_and_switch_to(&mut project)
//         .prepare_deposit_by(ProjectAccount::Bob)
//         .with_funds(200, ProjectCoin::Denom)
//         .with_asset(ProjectCoin::Denom, "1")
//         .with_down_counter(1)
//         .execute_and_switch_to(&mut project)
//         // query all users
//         .query_users(&[])
//         .assert_user(
//             User::prepare()
//                 .with_funds(100, ProjectCoin::Denom)
//                 .with_asset(ProjectToken::Atom, "1")
//                 .with_rebalancing(false)
//                 .with_down_counter(10)
//                 .complete_with_name(ProjectAccount::Alice),
//         )
//         .assert_user(
//             User::prepare()
//                 .with_funds(200, ProjectCoin::Denom)
//                 .with_asset(ProjectCoin::Denom, "1")
//                 .with_rebalancing(false)
//                 .with_down_counter(1)
//                 .complete_with_name(ProjectAccount::Bob),
//         )
//         // query specified users
//         .query_users(&[ProjectAccount::Alice, ProjectAccount::Bob])
//         .assert_user(
//             User::prepare()
//                 .with_funds(100, ProjectCoin::Denom)
//                 .with_asset(ProjectToken::Atom, "1")
//                 .with_rebalancing(false)
//                 .with_down_counter(10)
//                 .complete_with_name(ProjectAccount::Alice),
//         )
//         .assert_user(
//             User::prepare()
//                 .with_funds(200, ProjectCoin::Denom)
//                 .with_asset(ProjectCoin::Denom, "1")
//                 .with_rebalancing(false)
//                 .with_down_counter(1)
//                 .complete_with_name(ProjectAccount::Bob),
//         )
//         // query single user
//         .query_users(&[ProjectAccount::Alice])
//         .assert_user(
//             User::prepare()
//                 .with_funds(100, ProjectCoin::Denom)
//                 .with_asset(ProjectToken::Atom, "1")
//                 .with_rebalancing(false)
//                 .with_down_counter(10)
//                 .complete_with_name(ProjectAccount::Alice),
//         );
// }

// #[test]
// fn deposit_and_update_parameters() {
//     let mut project = Project::new(None);
//     project
//         // deposit only with necessary parameters
//         .prepare_deposit_by(ProjectAccount::Alice)
//         .with_asset(ProjectToken::Atom, "1")
//         .with_down_counter(10)
//         .execute_and_switch_to(&mut project)
//         .query_users(&[])
//         .assert_user(
//             User::prepare()
//                 .with_asset(ProjectToken::Atom, "1")
//                 .with_rebalancing(false)
//                 .with_down_counter(10)
//                 .complete_with_name(ProjectAccount::Alice),
//         )
//         // add asset
//         .prepare_deposit_by(ProjectAccount::Alice)
//         .with_asset(ProjectToken::Atom, "0.8")
//         .with_asset(ProjectCoin::Noria, "0.2")
//         .execute_and_switch_to(&mut project)
//         .query_users(&[])
//         .assert_user(
//             User::prepare()
//                 .with_asset(ProjectToken::Atom, "0.8")
//                 .with_asset(ProjectCoin::Noria, "0.2")
//                 .with_rebalancing(false)
//                 .with_down_counter(10)
//                 .complete_with_name(ProjectAccount::Alice),
//         )
//         // remove asset
//         .prepare_deposit_by(ProjectAccount::Alice)
//         .with_asset(ProjectCoin::Noria, "1")
//         .execute_and_switch_to(&mut project)
//         .query_users(&[])
//         .assert_user(
//             User::prepare()
//                 .with_asset(ProjectCoin::Noria, "1")
//                 .with_rebalancing(false)
//                 .with_down_counter(10)
//                 .complete_with_name(ProjectAccount::Alice),
//         )
//         // update down counter
//         .prepare_deposit_by(ProjectAccount::Alice)
//         .with_down_counter(5)
//         .execute_and_switch_to(&mut project)
//         .query_users(&[])
//         .assert_user(
//             User::prepare()
//                 .with_asset(ProjectCoin::Noria, "1")
//                 .with_rebalancing(false)
//                 .with_down_counter(5)
//                 .complete_with_name(ProjectAccount::Alice),
//         )
//         // update rebalancing
//         .prepare_deposit_by(ProjectAccount::Alice)
//         .with_rebalancing(true)
//         .execute_and_switch_to(&mut project)
//         .query_users(&[])
//         .assert_user(
//             User::prepare()
//                 .with_asset(ProjectCoin::Noria, "1")
//                 .with_rebalancing(true)
//                 .with_down_counter(5)
//                 .complete_with_name(ProjectAccount::Alice),
//         )
//         // add funds
//         .prepare_deposit_by(ProjectAccount::Alice)
//         .with_funds(100, ProjectCoin::Denom)
//         .execute_and_switch_to(&mut project)
//         .query_users(&[])
//         .assert_user(
//             User::prepare()
//                 .with_funds(100, ProjectCoin::Denom)
//                 .with_asset(ProjectCoin::Noria, "1")
//                 .with_rebalancing(true)
//                 .with_down_counter(5)
//                 .complete_with_name(ProjectAccount::Alice),
//         )
//         // update funds
//         .prepare_deposit_by(ProjectAccount::Alice)
//         .with_funds(100, ProjectCoin::Denom)
//         .execute_and_switch_to(&mut project)
//         .query_users(&[])
//         .assert_user(
//             User::prepare()
//                 .with_funds(200, ProjectCoin::Denom)
//                 .with_asset(ProjectCoin::Noria, "1")
//                 .with_rebalancing(true)
//                 .with_down_counter(5)
//                 .complete_with_name(ProjectAccount::Alice),
//         );
// }

// #[test]
// fn deposit_by_2_users() {
//     let mut project = Project::new(None);
//     project
//         // deposit by 1st user 1st time
//         .prepare_deposit_by(ProjectAccount::Alice)
//         .with_funds(100, ProjectCoin::Denom)
//         .with_asset(ProjectCoin::Noria, "0.6")
//         .with_asset(ProjectToken::Atom, "0.4")
//         .with_down_counter(10)
//         .execute_and_switch_to(&mut project)
//         // deposit by 2nd user 1st time
//         .prepare_deposit_by(ProjectAccount::Bob)
//         .with_funds(200, ProjectCoin::Denom)
//         .with_asset(ProjectCoin::Denom, "1")
//         .with_down_counter(1)
//         .execute_and_switch_to(&mut project)
//         // deposit by 1st user 2nd time
//         .prepare_deposit_by(ProjectAccount::Alice)
//         .with_funds(500, ProjectCoin::Denom)
//         .with_asset(ProjectCoin::Noria, "0.3")
//         .with_asset(ProjectToken::Atom, "0.3")
//         .with_asset(ProjectToken::Luna, "0.4")
//         .with_down_counter(20)
//         .execute_and_switch_to(&mut project)
//         // deposit by 2nd user 2nd time
//         .prepare_deposit_by(ProjectAccount::Bob)
//         .with_funds(100, ProjectCoin::Denom)
//         .with_asset(ProjectCoin::Denom, "0.6")
//         .with_asset(ProjectToken::Inj, "0.4")
//         .execute_and_switch_to(&mut project)
//         .query_users(&[])
//         .assert_user(
//             User::prepare()
//                 .with_funds(600, ProjectCoin::Denom)
//                 .with_asset(ProjectCoin::Noria, "0.3")
//                 .with_asset(ProjectToken::Atom, "0.3")
//                 .with_asset(ProjectToken::Luna, "0.4")
//                 .with_rebalancing(false)
//                 .with_down_counter(20)
//                 .complete_with_name(ProjectAccount::Alice),
//         )
//         .assert_user(
//             User::prepare()
//                 .with_funds(300, ProjectCoin::Denom)
//                 .with_asset(ProjectCoin::Denom, "0.6")
//                 .with_asset(ProjectToken::Inj, "0.4")
//                 .with_rebalancing(false)
//                 .with_down_counter(1)
//                 .complete_with_name(ProjectAccount::Bob),
//         );
// }

// #[test]
// fn withdraw() {
//     let mut project = Project::new(None);
//     project
//         // withdraw while user wasn't registered
//         .prepare_withdraw_by(ProjectAccount::Alice)
//         .with_amount(100)
//         .execute_and_switch_to(&mut project)
//         .assert_error(ContractError::UserIsNotFound {})
//         // register user
//         .prepare_deposit_by(ProjectAccount::Alice)
//         .with_funds(100, ProjectCoin::Denom)
//         .with_asset(ProjectToken::Atom, "1")
//         .with_down_counter(10)
//         .execute_and_switch_to(&mut project)
//         // withdraw zero amount
//         .prepare_withdraw_by(ProjectAccount::Alice)
//         .execute_and_switch_to(&mut project)
//         .assert_error("Cannot transfer empty coins amount")
//         // withdraw amount exceeding balance
//         .prepare_withdraw_by(ProjectAccount::Alice)
//         .with_amount(200)
//         .execute_and_switch_to(&mut project)
//         .assert_error(ContractError::WithdrawAmountIsExceeded {})
//         // withdraw part of balance
//         .prepare_withdraw_by(ProjectAccount::Alice)
//         .with_amount(20)
//         .execute_and_switch_to(&mut project)
//         .query_users(&[])
//         .assert_user(
//             User::prepare()
//                 .with_funds(80, ProjectCoin::Denom)
//                 .with_asset(ProjectToken::Atom, "1")
//                 .with_rebalancing(false)
//                 .with_down_counter(10)
//                 .complete_with_name(ProjectAccount::Alice),
//         );
// }

// #[test]
// fn update_config_by_non_admin() {
//     let mut project = Project::new(None);
//     project
//         .prepare_update_config_by(ProjectAccount::Alice)
//         .with_fee_rate("0.1")
//         .execute_and_switch_to(&mut project)
//         .assert_error(ContractError::Unauthorized {});
// }

// #[test]
// fn update_config_default() {
//     let mut project = Project::new(None);
//     let terraswap_factory_address = &project.get_terraswap_factory_address();
//     let terraswap_router_address = &project.get_terraswap_router_address();
//     project
//         .prepare_update_config_by(ProjectAccount::Admin)
//         .with_scheduler(ProjectAccount::Alice)
//         .with_terraswap_factory(terraswap_factory_address)
//         .with_terraswap_router(terraswap_router_address)
//         .with_fee_rate("0.1")
//         .execute_and_switch_to(&mut project)
//         .query_config()
//         .assert_config(
//             Config::prepare_by(ProjectAccount::Admin)
//                 .with_scheduler(ProjectAccount::Alice)
//                 .with_terraswap_factory(terraswap_factory_address)
//                 .with_terraswap_router(terraswap_router_address)
//                 .with_fee_rate("0.1"),
//         );
// }

#[test]
fn query_assets_in_pools() {
    let mut project = Project::new(None);
    project.query_assets_in_pools().assert_assets_in_pools();
}

// #[test]
// fn swap_default() {
//     let mut project = Project::new(None);
//     project
//         // deposit with all parameters
//         .prepare_deposit_by(ProjectAccount::Alice)
//         .with_funds(1_000, ProjectCoin::Denom)
//         .with_asset(ProjectCoin::Noria, "0.6")
//         .with_asset(ProjectToken::Atom, "0.4")
//         .with_rebalancing(false)
//         .with_down_counter(1)
//         .execute_and_switch_to(&mut project)
//         //.query_balances(&Vec::<String>::new())
//         .query_users(&[])
//         // 1_000 ucrd -> 300 unoria + 40 contract0
//         .prepare_swap_by(ProjectAccount::Admin) // TODO: add scheduler account
//         .execute_and_switch_to(&mut project)
//         .query_users(&[]);
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
