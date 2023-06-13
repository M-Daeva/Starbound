use cosmwasm_std::{Addr, Uint128};
use cw_multi_test::Executor;

use crate::tests::suite::{
    Project, ProjectAccount, ProjectCoin, ProjectPair, ProjectToken, ToAddress,
    ToTerraswapAssetInfo,
};

#[test]
fn default() {
    let mut project = Project::new(None);

    // query pairs
    let pairs = project.get_terraswap_pair_list();
    println!("{:#?}", pairs);

    // query Denom-Noria pair info
    let pair_info = Project::get_pair_info_by_asset_pair(
        &project.get_terraswap_pair_list(),
        ProjectPair::DenomNoria,
    );
    println!("\n{:#?}\n", pair_info);

    // query all balances
    let res = project.query_all_balances(ProjectAccount::Admin);
    println!("{:#?}", res);

    // query all balances
    let res = project.query_all_balances(ProjectAccount::Alice);
    println!("{:#?}", res);

    // execute swap 500 denom -> noria
    project
        .swap_with_pair(
            ProjectAccount::Alice,
            500u128,
            ProjectToken::Atom,
            ProjectToken::Luna,
        )
        .unwrap();

    // query all balances
    let res = project.query_all_balances(ProjectAccount::Alice);
    println!("{:#?}", res);

    // // execute swap 250 denom -> noria
    // project
    //     .swap_with_router(
    //         ProjectAccount::Alice,
    //         250u128,
    //         &vec![terraswap::router::SwapOperation::TerraSwap {
    //             offer_asset_info: ProjectToken::Atom.to_terraswap_asset_info(),
    //             ask_asset_info: ProjectToken::Luna.to_terraswap_asset_info(),
    //         }],
    //     )
    //     .unwrap();

    // // query all balances
    // let res = project.query_all_balances(ProjectAccount::Alice);
    // println!("{:#?}", res);

    // // execute swap 250 denom -> noria
    // project
    //     .swap_with_router(
    //         ProjectAccount::Alice,
    //         250u128,
    //         &vec![terraswap::router::SwapOperation::TerraSwap {
    //             offer_asset_info: ProjectCoin::Denom.to_terraswap_asset_info(),
    //             ask_asset_info: ProjectCoin::Noria.to_terraswap_asset_info(),
    //         }],
    //     )
    //     .unwrap();

    // // query all balances
    // let res = project.query_all_balances(ProjectAccount::Alice);
    // println!("{:#?}", res);
}
