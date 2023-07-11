use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::{Addr, Decimal, Uint128};

use crate::state::{Config, User};

/// asset_info, price, decimals
pub type AssetData = (terraswap::asset::AssetInfo, Decimal, u8);
/// (account_address, Vec<(asset_info, asset_amount)>)
pub type AccountBalance = (Addr, Vec<(terraswap::asset::AssetInfo, Uint128)>);

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(Vec<(Addr, User)>)]
    QueryUsers { address_list: Vec<String> },
    #[returns(Config)]
    QueryConfig {},
    #[returns(Vec<terraswap::asset::PairInfo>)]
    QueryPairs {},
    #[returns(Vec<AssetData>)]
    QueryAssetsInPools {},
    #[returns(Vec<AccountBalance>)]
    QueryBalances { address_list: Vec<String> },
}
