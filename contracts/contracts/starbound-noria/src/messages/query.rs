use cosmwasm_schema::{cw_serde, QueryResponses};

use terraswap::asset::PairInfo;

use crate::state::{Config, User};

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(User)]
    QueryUsers { address_list: Vec<String> },
    #[returns(Config)]
    QueryConfig {},
    #[returns(Vec<PairInfo>)]
    QueryPairs {},
}
