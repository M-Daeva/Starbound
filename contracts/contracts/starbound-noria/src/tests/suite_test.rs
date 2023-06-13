use cosmwasm_std::{Addr, Uint128};
use cw_multi_test::Executor;

use crate::tests::suite::{
    Project, ProjectAccount, ProjectCoin, ProjectPair, ToAddress, ToTerraswapAssetInfo,
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

    // query lp
    let lp_token_balance: cw20::BalanceResponse = project
        .app
        .wrap()
        .query_wasm_smart(
            Addr::unchecked(pair_info.liquidity_token),
            &cw20_base::msg::QueryMsg::Balance {
                address: ProjectAccount::Admin.to_string(),
            },
        )
        .unwrap();

    println!("{:#?}", lp_token_balance);

    // query all balances
    let res = project.query_all_balances(ProjectAccount::Alice);
    println!("{:#?}", res);

    // execute swap 500 denom -> noria
    project
        .swap_with_pair(
            ProjectAccount::Alice,
            500u128,
            ProjectCoin::Denom,
            ProjectCoin::Noria,
        )
        .unwrap();

    // query all balances
    let res = project.query_all_balances(ProjectAccount::Alice);
    println!("{:#?}", res);

    // execute swap 250 denom -> noria
    project
        .swap_with_router(
            ProjectAccount::Alice,
            250u128,
            &vec![terraswap::router::SwapOperation::TerraSwap {
                offer_asset_info: ProjectCoin::Denom.to_terraswap_asset_info(),
                ask_asset_info: ProjectCoin::Noria.to_terraswap_asset_info(),
            }],
        )
        .unwrap();

    // query all balances
    let res = project.query_all_balances(ProjectAccount::Alice);
    println!("{:#?}", res);

    // increase allowance
    // it works for contract13 - lp token
    // and doesn't work for contract1 - cw20-base
    let res = project
        .app
        .execute_contract(
            ProjectAccount::Admin.to_address(),
            Addr::unchecked("contract1".to_string()),
            &cw20_base::msg::ExecuteMsg::IncreaseAllowance {
                spender: ProjectAccount::Alice.to_string(),
                amount: Uint128::from(10u128),
                expires: None,
            },
            &[],
        )
        .unwrap();
    println!("{:#?}", res);

    // query allowances
    let allowances: cw20::AllAllowancesResponse = project
        .app
        .wrap()
        .query_wasm_smart(
            Addr::unchecked("contract1"),
            &cw20_base::msg::QueryMsg::AllAllowances {
                owner: ProjectAccount::Admin.to_string(),
                start_after: None,
                limit: None,
            },
        )
        .unwrap();
    println!("{:#?}", allowances);
}
