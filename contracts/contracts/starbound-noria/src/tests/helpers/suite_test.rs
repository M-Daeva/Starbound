use crate::tests::helpers::suite::{
    Project, ProjectAccount, ProjectCoin, ProjectPair, ProjectToken, Testable, ToProjectAsset,
};

#[test]
fn default() {
    let mut project = Project::new(None);

    // // query pairs
    // let pairs = project.get_terraswap_pair_list();
    // println!("{:#?}", pairs);

    // // query Denom-Noria pair info
    // let pair_info = project.get_pair_info_by_asset_pair(ProjectPair::DenomNoria);
    // println!("\n{:#?}\n", pair_info);

    // // query all balances
    // let res = project.query_all_balances(ProjectAccount::Admin);
    // println!("{:#?}", res);

    // // query allowances
    // let res = project.query_allowances(ProjectAccount::Admin, ProjectToken::Luna);
    // println!("{:#?}", res);

    // // query all balances
    // let res = project.query_all_balances(ProjectAccount::Alice);
    // println!("{:#?}", res);

    // // execute swap 1e6 crd -> inj
    // project
    //     .swap_with_pair(
    //         ProjectAccount::Alice,
    //         1_000_000u128,
    //         ProjectCoin::Denom,
    //         ProjectToken::Inj,
    //     )
    //     .unwrap();

    // let res = project.query_all_balances(ProjectAccount::Alice);
    // println!("{:#?}", res);

    // 250 ATOM -> LUNA, LUNA -> DENOM
    project
        .swap_with_router(
            ProjectAccount::Alice,
            250u128,
            &[(
                ProjectToken::Atom.to_project_asset(),
                ProjectCoin::Denom.to_project_asset(),
            )],
        )
        .unwrap();

    // query all balances
    let res = project.query_all_balances(ProjectAccount::Alice);
    // println!("{:#?}", res);
    speculoos::assert_that(&res).matches(|balances| {
        balances.contains(&(
            ProjectToken::Atom.to_string(),
            cosmwasm_std::Uint128::from(999750u128),
        ))
    });
    speculoos::assert_that(&res).matches(|balances| {
        balances.contains(&(
            ProjectCoin::Denom.to_string(),
            cosmwasm_std::Uint128::from(1002485u128),
        ))
    });
}
