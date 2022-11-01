use cosmwasm_schema::{cw_serde, QueryResponses};

// preventing optimizer warning message
#[allow(unused_imports)]
use crate::messages::response::{
    DebugQueryBankResponse, DebugQueryPoolsAndUsersResponse, QueryAssetsResponse,
    QueryPoolsAndUsersResponse,
};

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(QueryAssetsResponse)]
    QueryAssets { address: String },
    #[returns(QueryPoolsAndUsersResponse)]
    QueryPoolsAndUsers {},
    #[returns(DebugQueryPoolsAndUsersResponse)]
    DebugQueryPoolsAndUsers {},
    #[returns(DebugQueryBankResponse)]
    DebugQueryBank {},
}
