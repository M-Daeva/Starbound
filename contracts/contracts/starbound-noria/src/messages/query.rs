use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Addr;

use crate::state::{AddrUnchecked, Config, Denom, Ledger, Pool, User};

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(User)]
    QueryUser { address: AddrUnchecked },
    #[returns(QueryPoolsAndUsersResponse)]
    QueryPoolsAndUsers {},
    #[returns(Ledger)]
    QueryLedger {},
    #[returns(Config)]
    QueryConfig {},
}

#[cw_serde]
pub struct QueryPoolsAndUsersResponse {
    pub users: Vec<(Addr, User)>,
    pub pools: Vec<(Denom, Pool)>,
}
