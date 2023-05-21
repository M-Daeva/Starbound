use cosmwasm_schema::{cw_serde, QueryResponses};

use crate::state::{Config, Ledger, PoolExtracted, User, UserExtracted};

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

#[cw_serde]
pub struct QueryUserResponse {
    pub user: User,
}

#[cw_serde]
pub struct QueryPoolsAndUsersResponse {
    pub users: Vec<UserExtracted>,
    pub pools: Vec<PoolExtracted>,
}

#[cw_serde]
pub struct QueryLedgerResponse {
    pub ledger: Ledger,
}

#[cw_serde]
pub struct QueryConfigResponse {
    pub config: Config,
}
