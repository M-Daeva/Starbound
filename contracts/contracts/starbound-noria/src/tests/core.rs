use crate::{
    error::ContractError,
    messages::query::AccountBalance,
    state::{Config, User},
    tests::helpers::{
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
fn query_users() {
    let mut project = Project::new(None);
    project
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_funds(100, ProjectCoin::Denom)
        .with_asset(ProjectToken::Atom, "1")
        .with_down_counter(10)
        .execute_and_switch_to(&mut project)
        .prepare_deposit_by(ProjectAccount::Bob)
        .with_funds(200, ProjectCoin::Denom)
        .with_asset(ProjectCoin::Denom, "1")
        .with_down_counter(1)
        .execute_and_switch_to(&mut project)
        // query all users
        .query_users(&[])
        .assert_user(
            User::prepare()
                .with_funds(100, ProjectCoin::Denom)
                .with_asset(ProjectToken::Atom, "1")
                .with_rebalancing(false)
                .with_down_counter(10)
                .complete_with_name(ProjectAccount::Alice),
        )
        .assert_user(
            User::prepare()
                .with_funds(200, ProjectCoin::Denom)
                .with_asset(ProjectCoin::Denom, "1")
                .with_rebalancing(false)
                .with_down_counter(1)
                .complete_with_name(ProjectAccount::Bob),
        )
        // query specified users
        .query_users(&[ProjectAccount::Alice, ProjectAccount::Bob])
        .assert_user(
            User::prepare()
                .with_funds(100, ProjectCoin::Denom)
                .with_asset(ProjectToken::Atom, "1")
                .with_rebalancing(false)
                .with_down_counter(10)
                .complete_with_name(ProjectAccount::Alice),
        )
        .assert_user(
            User::prepare()
                .with_funds(200, ProjectCoin::Denom)
                .with_asset(ProjectCoin::Denom, "1")
                .with_rebalancing(false)
                .with_down_counter(1)
                .complete_with_name(ProjectAccount::Bob),
        )
        // query single user
        .query_users(&[ProjectAccount::Alice])
        .assert_user(
            User::prepare()
                .with_funds(100, ProjectCoin::Denom)
                .with_asset(ProjectToken::Atom, "1")
                .with_rebalancing(false)
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
        // add asset
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_asset(ProjectToken::Atom, "0.8")
        .with_asset(ProjectCoin::Noria, "0.2")
        .execute_and_switch_to(&mut project)
        .query_users(&[])
        .assert_user(
            User::prepare()
                .with_asset(ProjectToken::Atom, "0.8")
                .with_asset(ProjectCoin::Noria, "0.2")
                .with_rebalancing(false)
                .with_down_counter(10)
                .complete_with_name(ProjectAccount::Alice),
        )
        // remove asset
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

#[test]
fn deposit_by_2_users() {
    let mut project = Project::new(None);
    project
        // deposit by 1st user 1st time
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_funds(100, ProjectCoin::Denom)
        .with_asset(ProjectCoin::Noria, "0.6")
        .with_asset(ProjectToken::Atom, "0.4")
        .with_down_counter(10)
        .execute_and_switch_to(&mut project)
        // deposit by 2nd user 1st time
        .prepare_deposit_by(ProjectAccount::Bob)
        .with_funds(200, ProjectCoin::Denom)
        .with_asset(ProjectCoin::Denom, "1")
        .with_down_counter(1)
        .execute_and_switch_to(&mut project)
        // deposit by 1st user 2nd time
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_funds(500, ProjectCoin::Denom)
        .with_asset(ProjectCoin::Noria, "0.3")
        .with_asset(ProjectToken::Atom, "0.3")
        .with_asset(ProjectToken::Luna, "0.4")
        .with_down_counter(20)
        .execute_and_switch_to(&mut project)
        // deposit by 2nd user 2nd time
        .prepare_deposit_by(ProjectAccount::Bob)
        .with_funds(100, ProjectCoin::Denom)
        .with_asset(ProjectCoin::Denom, "0.6")
        .with_asset(ProjectToken::Inj, "0.4")
        .execute_and_switch_to(&mut project)
        .query_users(&[])
        .assert_user(
            User::prepare()
                .with_funds(600, ProjectCoin::Denom)
                .with_asset(ProjectCoin::Noria, "0.3")
                .with_asset(ProjectToken::Atom, "0.3")
                .with_asset(ProjectToken::Luna, "0.4")
                .with_rebalancing(false)
                .with_down_counter(20)
                .complete_with_name(ProjectAccount::Alice),
        )
        .assert_user(
            User::prepare()
                .with_funds(300, ProjectCoin::Denom)
                .with_asset(ProjectCoin::Denom, "0.6")
                .with_asset(ProjectToken::Inj, "0.4")
                .with_rebalancing(false)
                .with_down_counter(1)
                .complete_with_name(ProjectAccount::Bob),
        );
}

#[test]
fn withdraw() {
    let mut project = Project::new(None);
    project
        // withdraw while user wasn't registered
        .prepare_withdraw_by(ProjectAccount::Alice)
        .with_amount(100)
        .execute_and_switch_to(&mut project)
        .assert_error(ContractError::UserIsNotFound {})
        // register user
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_funds(100, ProjectCoin::Denom)
        .with_asset(ProjectToken::Atom, "1")
        .with_down_counter(10)
        .execute_and_switch_to(&mut project)
        // withdraw zero amount
        .prepare_withdraw_by(ProjectAccount::Alice)
        .execute_and_switch_to(&mut project)
        .assert_error("Cannot transfer empty coins amount")
        // withdraw amount exceeding balance
        .prepare_withdraw_by(ProjectAccount::Alice)
        .with_amount(200)
        .execute_and_switch_to(&mut project)
        .assert_error(ContractError::WithdrawAmountIsExceeded {})
        // withdraw part of balance
        .prepare_withdraw_by(ProjectAccount::Alice)
        .with_amount(20)
        .execute_and_switch_to(&mut project)
        .query_users(&[])
        .assert_user(
            User::prepare()
                .with_funds(80, ProjectCoin::Denom)
                .with_asset(ProjectToken::Atom, "1")
                .with_rebalancing(false)
                .with_down_counter(10)
                .complete_with_name(ProjectAccount::Alice),
        );
}

#[test]
fn update_config_by_non_admin() {
    let mut project = Project::new(None);
    project
        .prepare_update_config_by(ProjectAccount::Alice)
        .with_fee_rate("0.1")
        .execute_and_switch_to(&mut project)
        .assert_error(ContractError::Unauthorized {});
}

#[test]
fn update_config_default() {
    let mut project = Project::new(None);
    let terraswap_factory_address = &project.get_terraswap_factory_address();
    let terraswap_router_address = &project.get_terraswap_router_address();
    project
        .prepare_update_config_by(ProjectAccount::Admin)
        .with_scheduler(ProjectAccount::Alice)
        .with_terraswap_factory(terraswap_factory_address)
        .with_terraswap_router(terraswap_router_address)
        .with_fee_rate("0.1")
        .execute_and_switch_to(&mut project)
        .query_config()
        .assert_config(
            Config::prepare_by(ProjectAccount::Admin)
                .with_scheduler(ProjectAccount::Alice)
                .with_terraswap_factory(terraswap_factory_address)
                .with_terraswap_router(terraswap_router_address)
                .with_fee_rate("0.1"),
        );
}

#[test]
fn query_assets_in_pools() {
    let mut project = Project::new(None);
    project.query_assets_in_pools().assert_assets_in_pools();
}

#[test]
fn swap_and_transfer_default() {
    let mut project = Project::new(None);
    project
        // register scheduler
        .prepare_update_config_by(ProjectAccount::Admin)
        .with_scheduler(ProjectAccount::Scheduler)
        .execute_and_switch_to(&mut project)
        // deposit with all parameters
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_funds(100_000, ProjectCoin::Denom)
        .with_asset(ProjectCoin::Noria, "0.6")
        .with_asset(ProjectToken::Atom, "0.4")
        .with_rebalancing(false)
        .with_down_counter(1)
        .execute_and_switch_to(&mut project)
        // swap and transfer 100_000 ucrd -> 30_000 unoria + 4_000 contract0
        .prepare_swap_by(ProjectAccount::Scheduler)
        .execute_and_switch_to(&mut project)
        .prepare_transfer_by(ProjectAccount::Scheduler)
        .execute_and_switch_to(&mut project)
        .query_balances(&[])
        .assert_partial_balance(
            AccountBalance::prepare_for(ProjectAccount::Alice)
                .with_funds(900_000, ProjectCoin::Denom)
                .with_funds(1_029_910, ProjectCoin::Noria)
                .with_funds(1_003_976, ProjectToken::Atom),
        );
}
