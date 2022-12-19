use cosmwasm_schema::{cw_serde, QueryResponses};

// preventing optimizer warning message
#[allow(unused_imports)]
use crate::messages::response::{
    QueryConfigResponse, QueryLedgerResponse, QueryPoolsAndUsersResponse, QueryUserResponse,
};

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(QueryUserResponse)]
    QueryUser { address: String },
    #[returns(QueryPoolsAndUsersResponse)]
    QueryPoolsAndUsers {},
    #[returns(QueryLedgerResponse)]
    QueryLedger {},
    #[returns(QueryConfigResponse)]
    QueryConfig {},
}
