use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Addr;

use crate::state::{AddrUnchecked, Config, Denom, Ledger, Pool, User};

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(QueryUserResponse)]
    QueryUser { address: AddrUnchecked },
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
    pub users: Vec<(Addr, User)>,
    pub pools: Vec<(Denom, Pool)>,
}

#[cw_serde]
pub struct QueryLedgerResponse {
    pub ledger: Ledger,
}

#[cw_serde]
pub struct QueryConfigResponse {
    pub config: Config,
}
