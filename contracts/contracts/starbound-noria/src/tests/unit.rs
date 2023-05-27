use cosmwasm_std::{coin, Addr, Decimal, Uint128};

use std::ops::{Add, Div};

use crate::{
    actions::helpers::math::{str_to_dec, u128_to_dec},
    messages::query::QueryPoolsAndUsersResponse,
    state::{Asset, Denom, Pool, User},
    tests::helpers::{
        Project, UserName, ADDR_ADMIN_OSMO, ADDR_ALICE_ATOM, ADDR_ALICE_OSMO, ADDR_BOB_ATOM,
        ADDR_BOB_OSMO, ADDR_BOB_SCRT, DENOM_ATOM, DENOM_EEUR, DENOM_OSMO, DENOM_SCRT, FUNDS_AMOUNT,
    },
};

#[test]
fn deposit() {
    let mut prj = Project::new(None);
    let user = Project::get_user(UserName::Alice);

    prj.init_pools(ADDR_ADMIN_OSMO).unwrap();

    prj.deposit(
        ADDR_ALICE_OSMO,
        &user.asset_list,
        user.is_rebalancing_used,
        user.day_counter,
        &[coin(user.deposited.u128(), DENOM_EEUR)],
    )
    .unwrap();

    let res = prj.query_user(ADDR_ALICE_OSMO);

    assert_eq!(res.unwrap(), user);
}

#[test]
fn deposit_multiple_times_and_without_assets() {
    let mut prj = Project::new(None);
    let mut user = Project::get_user(UserName::Alice);

    prj.init_pools(ADDR_ADMIN_OSMO).unwrap();

    prj.deposit(
        ADDR_ALICE_OSMO,
        &user.asset_list,
        user.is_rebalancing_used,
        user.day_counter,
        &[coin(FUNDS_AMOUNT / 10, DENOM_EEUR)],
    )
    .unwrap();

    prj.deposit(
        ADDR_ALICE_OSMO,
        &user.asset_list,
        user.is_rebalancing_used,
        user.day_counter,
        &[coin(FUNDS_AMOUNT / 10, DENOM_EEUR)],
    )
    .unwrap();

    let res = prj.query_user(ADDR_ALICE_OSMO);

    user.deposited = Uint128::from(2 * FUNDS_AMOUNT / 10);

    assert_eq!(res.unwrap(), user.clone());

    prj.deposit(
        ADDR_ALICE_OSMO,
        &vec![],
        user.is_rebalancing_used,
        user.day_counter,
        &[coin(FUNDS_AMOUNT / 10, DENOM_EEUR)],
    )
    .unwrap();

    let res = prj.query_user(ADDR_ALICE_OSMO);

    user.deposited = Uint128::from(3 * FUNDS_AMOUNT / 10);

    assert_eq!(res.unwrap(), user);
}

#[test]
fn deposit_unsupported_asset() {
    let mut prj = Project::new(None);
    let user = Project::get_user(UserName::Alice);

    let res = prj
        .deposit(
            ADDR_ALICE_OSMO,
            &user.asset_list,
            user.is_rebalancing_used,
            user.day_counter,
            &[coin(user.deposited.u128(), DENOM_OSMO)],
        )
        .unwrap_err();

    assert_eq!(&res.to_string(), "Overflow: Cannot Sub with 0 and 10000")
}

// check if asset outside pool list can not be deposited (excluding osmo)
#[test]
fn deposit_non_pool_asset_osmo() {
    let mut prj = Project::new(None);
    let mut user = Project::get_user(UserName::Alice);
    user.asset_list.push(Asset::new(
        DENOM_OSMO,
        &Addr::unchecked(ADDR_ALICE_OSMO),
        Uint128::zero(),
        u128_to_dec(0_u128),
        Uint128::zero(),
    ));

    prj.init_pools(ADDR_ADMIN_OSMO).unwrap();

    prj.deposit(
        ADDR_ALICE_OSMO,
        &user.asset_list,
        user.is_rebalancing_used,
        user.day_counter,
        &[coin(user.deposited.u128(), DENOM_EEUR)],
    )
    .unwrap();

    let res = prj.query_user(ADDR_ALICE_OSMO);

    assert_eq!(res.unwrap(), user);
}

// check if asset outside pool list can not be deposited
#[test]
#[should_panic]
fn deposit_non_pool_asset_scrt() {
    let mut prj = Project::new(None);
    let mut user = Project::get_user(UserName::Alice);
    user.asset_list.push(Asset::new(
        DENOM_SCRT,
        &Addr::unchecked(ADDR_BOB_SCRT),
        Uint128::zero(),
        u128_to_dec(0_u128),
        Uint128::zero(),
    ));

    prj.deposit(
        ADDR_ALICE_OSMO,
        &user.asset_list,
        user.is_rebalancing_used,
        user.day_counter,
        &[coin(user.deposited.u128(), DENOM_EEUR)],
    )
    .unwrap();
}

// check if user can not has multiple addresses on same asset
#[test]
fn deposit_and_update_wallet_address() {
    let mut prj = Project::new(None);
    let mut user = Project::get_user(UserName::Alice);

    prj.init_pools(ADDR_ADMIN_OSMO).unwrap();

    prj.deposit(
        ADDR_ALICE_OSMO,
        &user.asset_list,
        user.is_rebalancing_used,
        user.day_counter,
        &[coin(user.deposited.u128(), DENOM_EEUR)],
    )
    .unwrap();

    // ADDR_BOB_ATOM must replace ADDR_ALICE_ATOM
    user.asset_list[0].wallet_address = Addr::unchecked(ADDR_BOB_ATOM);

    prj.deposit(
        ADDR_ALICE_OSMO,
        &user.asset_list,
        user.is_rebalancing_used,
        user.day_counter,
        &[],
    )
    .unwrap();

    let res = prj.query_user(ADDR_ALICE_OSMO);

    assert_eq!(res.unwrap(), user);
}

// check if asset lists can be merged properly
#[test]
fn deposit_and_update_asset_list() {
    let mut prj = Project::new(None);
    let user = Project::get_user(UserName::Alice);

    prj.init_pools(ADDR_ADMIN_OSMO).unwrap();

    // add atom to asset list
    let asset_list = vec![Asset::new(
        DENOM_ATOM,
        &Addr::unchecked(ADDR_ALICE_ATOM),
        Uint128::zero(),
        str_to_dec("1"),
        Uint128::from(100_u128), // must be ignored
    )];

    prj.deposit(
        ADDR_ALICE_OSMO,
        &asset_list,
        user.is_rebalancing_used,
        user.day_counter,
        &[coin(user.deposited.u128(), DENOM_EEUR)],
    )
    .unwrap();

    let res = prj.query_user(ADDR_ALICE_OSMO).unwrap();
    assert_eq!(
        res,
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
    prj.deposit(
        ADDR_ALICE_OSMO,
        &user.asset_list,
        user.is_rebalancing_used,
        user.day_counter,
        &[],
    )
    .unwrap();

    let res = prj.query_user(ADDR_ALICE_OSMO).unwrap();

    assert_eq!(res, user);
}

#[test]
fn withdraw() {
    let mut prj = Project::new(None);
    let user = Project::get_user(UserName::Alice);

    prj.init_pools(ADDR_ADMIN_OSMO).unwrap();

    prj.deposit(
        ADDR_ALICE_OSMO,
        &user.asset_list,
        user.is_rebalancing_used,
        user.day_counter,
        &[coin(user.deposited.u128(), DENOM_EEUR)],
    )
    .unwrap();

    let part_of_deposited = user.deposited.div(Uint128::from(2_u128));

    prj.withdraw(ADDR_ALICE_OSMO, part_of_deposited).unwrap();

    let res = prj.query_user(ADDR_ALICE_OSMO);

    assert_eq!(
        res.unwrap(),
        User {
            deposited: part_of_deposited,
            ..user
        }
    );
}

#[test]
#[should_panic]
fn update_scheduler_before() {
    let mut prj = Project::new(None);

    let QueryPoolsAndUsersResponse {
        pools: res_pools,
        users: res_users,
    } = prj.query_pools_and_users().unwrap();

    prj.update_pools_and_users(ADDR_BOB_OSMO, res_pools, res_users)
        .unwrap();
}

#[test]
fn update_scheduler_after() {
    let mut prj = Project::new(None);
    let res = prj
        .update_config(
            ADDR_ADMIN_OSMO,
            Some(ADDR_BOB_OSMO.to_string()),
            None,
            None,
            None,
            None,
            None,
        )
        .unwrap();

    assert_eq!(Project::get_attr(&res, "method"), "update_config");

    let QueryPoolsAndUsersResponse {
        pools: res_pools,
        users: res_users,
    } = prj.query_pools_and_users().unwrap();

    prj.update_pools_and_users(ADDR_BOB_OSMO, res_pools, res_users)
        .unwrap();
}

#[test]
fn query_user() {
    let mut prj = Project::new(None);
    let user_alice = Project::get_user(UserName::Alice);
    let user_bob = Project::get_user(UserName::Bob);

    prj.init_pools(ADDR_ADMIN_OSMO).unwrap();

    prj.deposit(
        ADDR_ALICE_OSMO,
        &user_alice.asset_list,
        user_alice.is_rebalancing_used,
        user_alice.day_counter,
        &[coin(user_alice.deposited.u128(), DENOM_EEUR)],
    )
    .unwrap();
    prj.deposit(
        ADDR_BOB_OSMO,
        &user_bob.asset_list,
        user_bob.is_rebalancing_used,
        user_bob.day_counter,
        &[coin(user_bob.deposited.u128(), DENOM_EEUR)],
    )
    .unwrap();

    let res = prj.query_user(ADDR_ALICE_OSMO).unwrap();

    assert_eq!(res, user_alice);
}

#[test]
fn query_pools_and_users() {
    let mut prj = Project::new(None);
    let pools = Project::get_pools();
    let user_alice = Project::get_user(UserName::Alice);
    let user_bob = Project::get_user(UserName::Bob);

    prj.init_pools(ADDR_ADMIN_OSMO).unwrap();

    prj.deposit(
        ADDR_ALICE_OSMO,
        &user_alice.asset_list,
        user_alice.is_rebalancing_used,
        user_alice.day_counter,
        &[coin(user_alice.deposited.u128(), DENOM_EEUR)],
    )
    .unwrap();
    prj.deposit(
        ADDR_BOB_OSMO,
        &user_bob.asset_list,
        user_bob.is_rebalancing_used,
        user_bob.day_counter,
        &[coin(user_bob.deposited.u128(), DENOM_EEUR)],
    )
    .unwrap();

    let QueryPoolsAndUsersResponse {
        pools: res_pools,
        users: res_users,
    } = prj.query_pools_and_users().unwrap();

    assert_eq!(
        res_pools
            .iter()
            .map(|(_denom, pool)| pool.to_owned())
            .collect::<Vec<Pool>>(),
        pools
    );

    let assets_received = res_users
        .iter()
        .map(|(_addr, user)| user.asset_list.to_owned())
        .collect::<Vec<Vec<Asset>>>();

    // user order matters!
    let assets_initial = vec![user_bob, user_alice]
        .iter()
        .map(|x| x.asset_list.to_owned())
        .collect::<Vec<Vec<Asset>>>();

    assert_eq!(assets_received, assets_initial)
}

#[test]
fn update_pools_and_users() {
    // initialize
    let mut prj = Project::new(None);
    let user_alice = Project::get_user(UserName::Alice);
    let user_bob = Project::get_user(UserName::Bob);

    prj.init_pools(ADDR_ADMIN_OSMO).unwrap();

    prj.deposit(
        ADDR_ALICE_OSMO,
        &user_alice.asset_list,
        user_alice.is_rebalancing_used,
        user_alice.day_counter,
        &[coin(user_alice.deposited.u128(), DENOM_EEUR)],
    )
    .unwrap();
    prj.deposit(
        ADDR_BOB_OSMO,
        &user_bob.asset_list,
        user_bob.is_rebalancing_used,
        user_bob.day_counter,
        &[coin(user_bob.deposited.u128(), DENOM_EEUR)],
    )
    .unwrap();

    // request data
    let QueryPoolsAndUsersResponse {
        pools: res_pools,
        users: res_users,
    } = prj.query_pools_and_users().unwrap();

    // update data
    let pools_updated = res_pools
        .iter()
        .map(|(denom, pool)| {
            (
                denom.to_owned(),
                Pool {
                    price: pool.price.add(Decimal::one()),
                    ..pool.to_owned()
                },
            )
        })
        .collect::<Vec<(Denom, Pool)>>();

    let users_updated = res_users
        .iter()
        .map(|(addr, user)| {
            (
                addr.to_owned(),
                User {
                    asset_list: user
                        .asset_list
                        .iter()
                        .map(|y| Asset {
                            wallet_balance: y.wallet_balance.add(Uint128::from(500_u128)),
                            ..y.to_owned()
                        })
                        .collect::<Vec<Asset>>(),
                    ..user.to_owned()
                },
            )
        })
        .collect::<Vec<(Addr, User)>>();

    prj.update_pools_and_users(
        ADDR_ADMIN_OSMO,
        pools_updated.clone(),
        users_updated.clone(),
    )
    .unwrap();

    // check changes
    let QueryPoolsAndUsersResponse {
        pools: res_pools_updated,
        users: res_users_updated,
    } = prj.query_pools_and_users().unwrap();

    assert_eq!(res_pools_updated, pools_updated);
    assert_eq!(res_users_updated, users_updated);
}

// check if asset outside pool list can not be added
#[test]
fn update_pools_and_users_unsupported_asset() {
    // initialize
    let mut prj = Project::new(None);
    let user_alice = Project::get_user(UserName::Alice);
    let user_bob = Project::get_user(UserName::Bob);

    prj.init_pools(ADDR_ADMIN_OSMO).unwrap();

    prj.deposit(
        ADDR_ALICE_OSMO,
        &user_alice.asset_list,
        user_alice.is_rebalancing_used,
        user_alice.day_counter,
        &[coin(user_alice.deposited.u128(), DENOM_EEUR)],
    )
    .unwrap();
    prj.deposit(
        ADDR_BOB_OSMO,
        &user_bob.asset_list,
        user_bob.is_rebalancing_used,
        user_bob.day_counter,
        &[coin(user_bob.deposited.u128(), DENOM_EEUR)],
    )
    .unwrap();

    // request data
    let QueryPoolsAndUsersResponse {
        pools: res_pools,
        users: res_users,
    } = prj.query_pools_and_users().unwrap();

    // update data
    let mut users_updated = res_users.clone();
    users_updated[0].1.asset_list.push(Asset::new(
        DENOM_SCRT,
        &Addr::unchecked(ADDR_BOB_SCRT),
        Uint128::zero(),
        Decimal::one(),
        Uint128::zero(),
    ));

    prj.update_pools_and_users(ADDR_ADMIN_OSMO, res_pools, users_updated)
        .unwrap();

    // check changes
    let QueryPoolsAndUsersResponse {
        pools: _res_pools_updated,
        users: res_users_updated,
    } = prj.query_pools_and_users().unwrap();

    assert_eq!(res_users_updated, res_users);
}
