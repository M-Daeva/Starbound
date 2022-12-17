use cosmwasm_schema::cw_serde;

use crate::state::{Ledger, PoolExtracted, User, UserExtracted};

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
