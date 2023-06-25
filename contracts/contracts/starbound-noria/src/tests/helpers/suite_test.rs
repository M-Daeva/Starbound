use crate::tests::helpers::suite::{
    Project, ProjectAccount, ProjectCoin, ProjectPair, ProjectToken, Testable, ToTerraswapAssetInfo,
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

    // // 250 ATOM -> LUNA, LUNA -> DENOM, DENOM -> INJ
    // project
    //     .swap_with_router(
    //         ProjectAccount::Alice,
    //         250u128,
    //         &[
    //             terraswap::router::SwapOperation::TerraSwap {
    //                 offer_asset_info: ProjectToken::Atom.to_terraswap_asset_info(),
    //                 ask_asset_info: ProjectToken::Luna.to_terraswap_asset_info(),
    //             },
    //             terraswap::router::SwapOperation::TerraSwap {
    //                 offer_asset_info: ProjectToken::Luna.to_terraswap_asset_info(),
    //                 ask_asset_info: ProjectCoin::Denom.to_terraswap_asset_info(),
    //             },
    //             terraswap::router::SwapOperation::TerraSwap {
    //                 offer_asset_info: ProjectCoin::Denom.to_terraswap_asset_info(),
    //                 ask_asset_info: ProjectToken::Inj.to_terraswap_asset_info(),
    //             },
    //         ],
    //     )
    //     .unwrap();

    // // query all balances
    // let res = project.query_all_balances(ProjectAccount::Alice);
    // println!("{:#?}", res);
}
