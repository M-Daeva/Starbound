use cosmwasm_std::{attr, coin, from_binary, Addr};

use crate::{
    actions::rebalancer::str_to_dec,
    contract::{execute, query},
    messages::{
        execute::ExecuteMsg,
        query::QueryMsg,
        response::{
            DebugQueryBankResponse, DebugQueryPoolsAndUsersResponse, QueryAssetsResponse,
            QueryPoolsAndUsersResponse,
        },
    },
    state::{Asset, AssetExtracted, PoolExtracted, User, UserExtracted},
    tests::helpers::{
        get_instance, instantiate_and_deposit, ADDR_ADMIN_OSMO, ADDR_ALICE_ATOM, ADDR_ALICE_JUNO,
        ADDR_ALICE_OSMO, ADDR_BOB_ATOM, ADDR_BOB_JUNO, ADDR_BOB_OSMO, CHANNEL_ID, DENOM_ATOM,
        DENOM_EEUR, DENOM_JUNO, FUNDS_AMOUNT, IS_CONTROLLED_REBALANCING, IS_CURRENT_PERIOD,
        POOLS_AMOUNT_INITIAL,
    },
};

#[test]
fn test_init() {
    let (_, _, _, res) = get_instance(ADDR_ADMIN_OSMO);

    assert_eq!(
        res.unwrap().attributes,
        vec![
            attr("method", "instantiate"),
            attr("admin", ADDR_ADMIN_OSMO),
            attr("scheduler", ADDR_ADMIN_OSMO),
            attr("pools_amount", POOLS_AMOUNT_INITIAL),
        ]
    )
}

#[test]
fn test_execute_deposit() {
    let (_, _, _, res) =
        instantiate_and_deposit(IS_CONTROLLED_REBALANCING, IS_CURRENT_PERIOD, FUNDS_AMOUNT);

    let user_deposited_on_current_period = if IS_CURRENT_PERIOD { FUNDS_AMOUNT } else { 0 };
    let user_deposited_on_next_period = if !IS_CURRENT_PERIOD { FUNDS_AMOUNT } else { 0 };

    assert_eq!(
        res.unwrap().attributes,
        vec![
            attr("method", "deposit"),
            attr("user_address", ADDR_ALICE_OSMO),
            attr(
                "user_deposited_on_current_period",
                user_deposited_on_current_period.to_string()
            ),
            attr(
                "user_deposited_on_next_period",
                user_deposited_on_next_period.to_string()
            ),
        ]
    )
}

// check if user can not has multiple addresses on same asset
#[test]
fn test_execute_deposit_and_update_wallet_address() {
    let (mut deps, env, mut info, _res) =
        instantiate_and_deposit(IS_CONTROLLED_REBALANCING, IS_CURRENT_PERIOD, FUNDS_AMOUNT);

    let asset_list_alice = vec![
        Asset {
            asset_denom: DENOM_ATOM.to_string(),
            // new address must replace old one
            wallet_address: Addr::unchecked(ADDR_BOB_ATOM),
            wallet_balance: 0,
            weight: str_to_dec("0.5"),
            amount_to_send_until_next_epoch: 0,
        },
        Asset {
            asset_denom: DENOM_JUNO.to_string(),
            wallet_address: Addr::unchecked(ADDR_ALICE_JUNO),
            wallet_balance: 0,
            weight: str_to_dec("0.5"),
            amount_to_send_until_next_epoch: 0,
        },
    ];

    let user = User {
        asset_list: asset_list_alice,
        day_counter: 3,
        deposited_on_current_period: 0,
        deposited_on_next_period: 0,
        is_controlled_rebalancing: IS_CONTROLLED_REBALANCING,
    };

    let msg = ExecuteMsg::Deposit { user };

    // deposit without funds
    info.funds = vec![coin(0, DENOM_EEUR)];
    let _res = execute(deps.as_mut(), env.clone(), info, msg);

    let msg = QueryMsg::QueryAssets {
        address: ADDR_ALICE_OSMO.to_string(),
    };
    let bin = query(deps.as_ref(), env, msg).unwrap();
    let res = from_binary::<QueryAssetsResponse>(&bin).unwrap();

    assert_eq!(res.asset_list[0].wallet_address, ADDR_BOB_ATOM);
}

#[test]
fn test_execute_withdraw() {
    let (mut deps, env, info, _res) =
        instantiate_and_deposit(IS_CONTROLLED_REBALANCING, IS_CURRENT_PERIOD, FUNDS_AMOUNT);

    let msg = ExecuteMsg::Withdraw {
        amount: FUNDS_AMOUNT / 10,
    };

    let res = execute(deps.as_mut(), env, info, msg);

    let user_deposited_on_current_period = if IS_CURRENT_PERIOD {
        9 * FUNDS_AMOUNT / 10
    } else {
        0
    };
    let user_deposited_on_next_period = if !IS_CURRENT_PERIOD {
        9 * FUNDS_AMOUNT / 10
    } else {
        0
    };

    assert_eq!(
        res.unwrap().attributes,
        vec![
            attr("method", "withdraw"),
            attr("user_address", ADDR_ALICE_OSMO),
            attr(
                "user_deposited_on_current_period",
                user_deposited_on_current_period.to_string()
            ),
            attr(
                "user_deposited_on_next_period",
                user_deposited_on_next_period.to_string()
            ),
        ]
    )
}

#[test]
fn test_execute_update_scheduler() {
    let (mut deps, env, info, _res) = get_instance(ADDR_ADMIN_OSMO);

    let msg = ExecuteMsg::UpdateScheduler {
        address: ADDR_ALICE_OSMO.to_string(),
    };

    let res = execute(deps.as_mut(), env, info, msg);

    assert_eq!(
        res.unwrap().attributes,
        vec![
            attr("method", "update_scheduler"),
            attr("scheduler", ADDR_ALICE_OSMO),
        ]
    )
}

#[test]
fn test_execute_update_pools_and_users() {
    let (mut deps, env, mut info, _res) =
        instantiate_and_deposit(IS_CONTROLLED_REBALANCING, IS_CURRENT_PERIOD, FUNDS_AMOUNT);

    // add 2nd user
    let funds_amount = 600_000;
    let funds_denom = DENOM_EEUR;

    let asset_list_bob: Vec<Asset> = vec![
        Asset {
            asset_denom: DENOM_ATOM.to_string(),
            wallet_address: Addr::unchecked(ADDR_BOB_ATOM),
            wallet_balance: 10_000_000,
            weight: str_to_dec("0.3"),
            amount_to_send_until_next_epoch: 0,
        },
        Asset {
            asset_denom: DENOM_JUNO.to_string(),
            wallet_address: Addr::unchecked(ADDR_BOB_JUNO),
            wallet_balance: 10_000_000,
            weight: str_to_dec("0.7"),
            amount_to_send_until_next_epoch: 0,
        },
    ];

    let user = User {
        asset_list: asset_list_bob,
        day_counter: 3,
        deposited_on_current_period: funds_amount,
        deposited_on_next_period: 0,
        is_controlled_rebalancing: true,
    };

    let msg = ExecuteMsg::Deposit { user };
    info.funds = vec![coin(funds_amount, funds_denom)];
    info.sender = Addr::unchecked(ADDR_BOB_OSMO);

    let _res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

    // update data
    let pools: Vec<PoolExtracted> = vec![
        PoolExtracted {
            id: 1,
            denom: DENOM_ATOM.to_string(),
            price: str_to_dec("11.5"),
            symbol: "uatom".to_string(),
            channel_id: CHANNEL_ID.to_string(),
            port_id: "transfer".to_string(),
        },
        PoolExtracted {
            id: 497,
            denom: DENOM_JUNO.to_string(),
            price: str_to_dec("3.5"),
            symbol: "ujuno".to_string(),
            channel_id: CHANNEL_ID.to_string(),
            port_id: "transfer".to_string(),
        },
        PoolExtracted {
            id: 481,
            denom: DENOM_EEUR.to_string(),
            price: str_to_dec("1"),
            symbol: "debug_ueeur".to_string(),
            channel_id: CHANNEL_ID.to_string(),
            port_id: "transfer".to_string(),
        },
    ];

    let users: Vec<UserExtracted> = vec![
        UserExtracted {
            osmo_address: ADDR_ALICE_OSMO.to_string(),
            asset_list: vec![
                AssetExtracted {
                    asset_denom: DENOM_ATOM.to_string(),
                    wallet_address: ADDR_ALICE_ATOM.to_string(),
                    wallet_balance: 1,
                },
                AssetExtracted {
                    asset_denom: DENOM_JUNO.to_string(),
                    wallet_address: ADDR_ALICE_JUNO.to_string(),
                    wallet_balance: 2,
                },
            ],
        },
        UserExtracted {
            osmo_address: ADDR_BOB_OSMO.to_string(),
            asset_list: vec![
                AssetExtracted {
                    asset_denom: DENOM_ATOM.to_string(),
                    wallet_address: ADDR_BOB_ATOM.to_string(),
                    wallet_balance: 10_000_001,
                },
                AssetExtracted {
                    asset_denom: DENOM_JUNO.to_string(),
                    wallet_address: ADDR_BOB_JUNO.to_string(),
                    wallet_balance: 10_000_002,
                },
            ],
        },
    ];

    let msg = ExecuteMsg::UpdatePoolsAndUsers { pools, users };
    info.sender = Addr::unchecked(ADDR_ADMIN_OSMO);
    let res = execute(deps.as_mut(), env, info, msg);

    assert_eq!(
        res.unwrap().attributes,
        vec![attr("method", "update_pools_and_users"),]
    )
}

#[test]
fn test_execute_swap() {
    let (mut deps, env, mut info, _res) =
        instantiate_and_deposit(IS_CONTROLLED_REBALANCING, IS_CURRENT_PERIOD, FUNDS_AMOUNT);

    let msg = ExecuteMsg::Swap {};
    info.sender = Addr::unchecked(ADDR_ADMIN_OSMO);
    let res = execute(deps.as_mut(), env, info, msg);

    assert_eq!(res.unwrap().attributes, vec![attr("method", "swap"),])
}

#[test]
fn test_execute_swap_with_updated_users() {
    let (mut deps, env, mut info, _res) =
        instantiate_and_deposit(IS_CONTROLLED_REBALANCING, IS_CURRENT_PERIOD, FUNDS_AMOUNT);

    // add 2nd user
    let funds_amount = 600_000;
    let funds_denom = DENOM_EEUR;

    let asset_list_bob: Vec<Asset> = vec![
        Asset {
            asset_denom: DENOM_ATOM.to_string(),
            wallet_address: Addr::unchecked(ADDR_BOB_ATOM),
            wallet_balance: 10_000_000,
            weight: str_to_dec("0.3"),
            amount_to_send_until_next_epoch: 0,
        },
        Asset {
            asset_denom: DENOM_JUNO.to_string(),
            wallet_address: Addr::unchecked(ADDR_BOB_JUNO),
            wallet_balance: 10_000_000,
            weight: str_to_dec("0.7"),
            amount_to_send_until_next_epoch: 0,
        },
    ];

    let user = User {
        asset_list: asset_list_bob,
        day_counter: 3,
        deposited_on_current_period: funds_amount,
        deposited_on_next_period: 0,
        is_controlled_rebalancing: IS_CONTROLLED_REBALANCING,
    };

    let msg = ExecuteMsg::Deposit { user };
    info.funds = vec![coin(funds_amount, funds_denom)];
    info.sender = Addr::unchecked(ADDR_BOB_OSMO);

    let _res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

    // update data
    let pools: Vec<PoolExtracted> = vec![
        PoolExtracted {
            id: 1,
            denom: DENOM_ATOM.to_string(),
            price: str_to_dec("11.5"),
            symbol: "uatom".to_string(),
            channel_id: CHANNEL_ID.to_string(),
            port_id: "transfer".to_string(),
        },
        PoolExtracted {
            id: 497,
            denom: DENOM_JUNO.to_string(),
            price: str_to_dec("3.5"),
            symbol: "ujuno".to_string(),
            channel_id: CHANNEL_ID.to_string(),
            port_id: "transfer".to_string(),
        },
        PoolExtracted {
            id: 481,
            denom: DENOM_EEUR.to_string(),
            price: str_to_dec("1"),
            symbol: "debug_ueeur".to_string(),
            channel_id: CHANNEL_ID.to_string(),
            port_id: "transfer".to_string(),
        },
    ];

    let users: Vec<UserExtracted> = vec![
        UserExtracted {
            osmo_address: ADDR_ALICE_OSMO.to_string(),
            asset_list: vec![
                AssetExtracted {
                    asset_denom: DENOM_ATOM.to_string(),
                    wallet_address: ADDR_ALICE_ATOM.to_string(),
                    wallet_balance: 1,
                },
                AssetExtracted {
                    asset_denom: DENOM_JUNO.to_string(),
                    wallet_address: ADDR_ALICE_JUNO.to_string(),
                    wallet_balance: 2,
                },
            ],
        },
        UserExtracted {
            osmo_address: ADDR_BOB_OSMO.to_string(),
            asset_list: vec![
                AssetExtracted {
                    asset_denom: DENOM_ATOM.to_string(),
                    wallet_address: ADDR_BOB_ATOM.to_string(),
                    wallet_balance: 10_000_001,
                },
                AssetExtracted {
                    asset_denom: DENOM_JUNO.to_string(),
                    wallet_address: ADDR_BOB_JUNO.to_string(),
                    wallet_balance: 10_000_002,
                },
            ],
        },
    ];

    let msg = ExecuteMsg::UpdatePoolsAndUsers { pools, users };
    info.sender = Addr::unchecked(ADDR_ADMIN_OSMO);
    let _res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

    let msg = ExecuteMsg::Swap {};
    info.sender = Addr::unchecked(ADDR_ADMIN_OSMO);
    let res = execute(deps.as_mut(), env, info, msg);

    assert_eq!(res.unwrap().attributes, vec![attr("method", "swap"),])
}

#[test]
fn test_execute_transfer() {
    let (mut deps, env, mut info, _res) =
        instantiate_and_deposit(IS_CONTROLLED_REBALANCING, IS_CURRENT_PERIOD, FUNDS_AMOUNT);

    let msg = ExecuteMsg::Swap {};
    info.sender = Addr::unchecked(ADDR_ADMIN_OSMO);
    let _res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

    let msg = ExecuteMsg::Transfer {};
    info.sender = Addr::unchecked(ADDR_ADMIN_OSMO);
    let res = execute(deps.as_mut(), env, info, msg);

    assert_eq!(res.unwrap().attributes, vec![attr("method", "transfer"),])
}

#[test]
fn test_query_pools_and_users() {
    let (deps, env, mut _info, _res) =
        instantiate_and_deposit(IS_CONTROLLED_REBALANCING, IS_CURRENT_PERIOD, FUNDS_AMOUNT);

    let msg = QueryMsg::QueryPoolsAndUsers {};
    let bin = query(deps.as_ref(), env, msg).unwrap();
    let res = from_binary::<QueryPoolsAndUsersResponse>(&bin).unwrap();

    assert_eq!(
        res.pools.len(),
        POOLS_AMOUNT_INITIAL.parse::<usize>().unwrap()
    );
    assert_eq!(res.users.len(), 1);
}

#[test]
fn test_debug_query_pools_and_users() {
    let (deps, env, mut _info, _res) =
        instantiate_and_deposit(IS_CONTROLLED_REBALANCING, IS_CURRENT_PERIOD, FUNDS_AMOUNT);

    let msg = QueryMsg::DebugQueryPoolsAndUsers {};
    let bin = query(deps.as_ref(), env, msg).unwrap();
    let res = from_binary::<DebugQueryPoolsAndUsersResponse>(&bin).unwrap();

    assert_eq!(
        res.pools.len(),
        POOLS_AMOUNT_INITIAL.parse::<usize>().unwrap()
    );
    assert_eq!(res.users.len(), 1);
}

#[test]
fn test_query_assets() {
    let (deps, env, mut _info, _res) =
        instantiate_and_deposit(IS_CONTROLLED_REBALANCING, IS_CURRENT_PERIOD, FUNDS_AMOUNT);

    let msg = QueryMsg::QueryAssets {
        address: ADDR_ALICE_OSMO.to_string(),
    };
    let bin = query(deps.as_ref(), env, msg).unwrap();
    let res = from_binary::<QueryAssetsResponse>(&bin).unwrap();

    assert_eq!(res.asset_list.len(), 2);
}

#[test]
fn test_debug_query_bank() {
    let (mut deps, env, mut info, _res) =
        instantiate_and_deposit(IS_CONTROLLED_REBALANCING, IS_CURRENT_PERIOD, FUNDS_AMOUNT);

    let msg = ExecuteMsg::Swap {};
    info.sender = Addr::unchecked(ADDR_ADMIN_OSMO);
    let _res = execute(deps.as_mut(), env.clone(), info, msg);

    let msg = QueryMsg::DebugQueryBank {};
    let bin = query(deps.as_ref(), env, msg).unwrap();
    let res = from_binary::<DebugQueryBankResponse>(&bin).unwrap();

    assert_eq!(res.global_denom_list.len(), 3);
}
