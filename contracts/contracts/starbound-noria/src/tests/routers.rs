use crate::{
    actions::helpers::routers::get_swap_routes,
    tests::helpers::suite::{Project, ProjectCoin, ProjectToken, Testable, ToTerraswapAssetInfo},
};

#[test]
fn simple_route() {
    speculoos::assert_that(
        &get_swap_routes(
            &Project::new(None).get_terraswap_pair_list(),
            ProjectCoin::Denom.to_terraswap_asset_info(),
            ProjectToken::Luna.to_terraswap_asset_info(),
        )
        .unwrap(),
    )
    .is_equal_to(vec![(
        ProjectCoin::Denom.to_terraswap_asset_info(),
        ProjectToken::Luna.to_terraswap_asset_info(),
    )]);
}

#[test]
fn simple_route_reversed() {
    speculoos::assert_that(
        &get_swap_routes(
            &Project::new(None).get_terraswap_pair_list(),
            ProjectToken::Luna.to_terraswap_asset_info(),
            ProjectCoin::Denom.to_terraswap_asset_info(),
        )
        .unwrap(),
    )
    .is_equal_to(vec![(
        ProjectToken::Luna.to_terraswap_asset_info(),
        ProjectCoin::Denom.to_terraswap_asset_info(),
    )]);
}

#[test]
fn complex_route() {
    speculoos::assert_that(
        &get_swap_routes(
            &Project::new(None).get_terraswap_pair_list(),
            ProjectToken::Atom.to_terraswap_asset_info(),
            ProjectCoin::Denom.to_terraswap_asset_info(),
        )
        .unwrap(),
    )
    .is_equal_to(vec![
        (
            ProjectToken::Atom.to_terraswap_asset_info(),
            ProjectToken::Luna.to_terraswap_asset_info(),
        ),
        (
            ProjectToken::Luna.to_terraswap_asset_info(),
            ProjectCoin::Denom.to_terraswap_asset_info(),
        ),
    ]);
}

#[test]
fn complex_route_reversed() {
    speculoos::assert_that(
        &get_swap_routes(
            &Project::new(None).get_terraswap_pair_list(),
            ProjectCoin::Denom.to_terraswap_asset_info(),
            ProjectToken::Atom.to_terraswap_asset_info(),
        )
        .unwrap(),
    )
    .is_equal_to(vec![
        (
            ProjectCoin::Denom.to_terraswap_asset_info(),
            ProjectToken::Luna.to_terraswap_asset_info(),
        ),
        (
            ProjectToken::Luna.to_terraswap_asset_info(),
            ProjectToken::Atom.to_terraswap_asset_info(),
        ),
    ]);
}
