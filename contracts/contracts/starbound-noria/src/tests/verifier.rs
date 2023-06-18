use crate::{
    error::ContractError,
    tests::{
        builders::*,
        suite::{Project, ProjectAccount, ProjectCoin, ProjectToken},
    },
};

#[test]
fn deposit_with_wrong_funds() {
    let mut project = Project::new(None);
    project
        // try to deposit regular coin instead of smoothcoin
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_funds(100, ProjectCoin::Noria)
        .with_asset(ProjectToken::Atom, "1")
        .with_down_counter(10)
        .execute_and_switch_to(&mut project)
        .assert_error(ContractError::UnexpectedFunds {})
        // try to deposit regular coin in addition to smoothcoin
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_funds(100, ProjectCoin::Denom)
        .with_funds(100, ProjectCoin::Noria)
        .with_asset(ProjectToken::Atom, "1")
        .with_down_counter(10)
        .execute_and_switch_to(&mut project)
        .assert_error(ContractError::UnexpectedFunds {});
}

#[test]
fn deposit_with_wrong_weights() {
    let mut project = Project::new(None);
    project
        // try to deposit with a weight out of range
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_funds(100, ProjectCoin::Denom)
        .with_asset(ProjectToken::Atom, "0")
        .with_asset(ProjectToken::Luna, "1.5")
        .with_down_counter(10)
        .execute_and_switch_to(&mut project)
        .assert_error(ContractError::WeightIsOutOfRange {})
        // try to deposit with sum of weights not equal 1
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_funds(100, ProjectCoin::Denom)
        .with_asset(ProjectToken::Atom, "0.4")
        .with_asset(ProjectToken::Luna, "0.5")
        .with_down_counter(10)
        .execute_and_switch_to(&mut project)
        .assert_error(ContractError::WeightsAreUnbalanced {})
        // try to deposit with duplicated assets
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_funds(100, ProjectCoin::Denom)
        .with_asset(ProjectToken::Atom, "0.3")
        .with_asset(ProjectToken::Luna, "0.4")
        .with_asset(ProjectToken::Atom, "0.3")
        .with_down_counter(10)
        .execute_and_switch_to(&mut project)
        .assert_error(ContractError::DuplicatedAssets {});
}

#[test]
fn deposit_with_wrong_asset_address() {
    let mut project = Project::new(None);
    project
        // try to deposit with wrong address
        .prepare_deposit_by(ProjectAccount::Alice)
        .with_funds(100, ProjectCoin::Denom)
        .with_asset("fake asset", "1")
        .with_down_counter(10)
        .execute_and_switch_to(&mut project)
        // TODO: uncomment after adding custom address generator
        // .assert_error(ContractError::InvalidAsset {})
        ;
}
