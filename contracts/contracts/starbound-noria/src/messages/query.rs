use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::{Addr, Decimal, Uint128};

use terraswap::asset::{AssetInfo, PairInfo};

use crate::state::{Config, User};

pub type QueryBalancesResponse = Vec<(Addr, Vec<(terraswap::asset::AssetInfo, Uint128)>)>;

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(Vec<(Addr, User)>)]
    QueryUsers { address_list: Vec<String> },
    #[returns(Config)]
    QueryConfig {},
    #[returns(Vec<PairInfo>)]
    QueryPairs {},
    #[returns(Vec<(AssetInfo, Decimal, u8)>)]
    QueryAssetsInPools {},
    #[returns(QueryBalancesResponse)]
    QueryBalances { address_list: Vec<String> },
}
