use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::{Addr, Decimal};

use terraswap::asset::{AssetInfo, PairInfo};

use crate::state::{Config, User};

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
}
