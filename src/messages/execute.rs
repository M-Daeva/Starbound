use crate::state::{PoolExtracted, TransferParams, User, UserExtracted};
use cosmwasm_schema::cw_serde;

#[cw_serde]
pub enum ExecuteMsg {
    Deposit {
        user: User,
    },
    Withdraw {
        amount: u128,
    },
    UpdateScheduler {
        address: String,
    },
    UpdatePoolsAndUsers {
        pools: Vec<PoolExtracted>,
        users: Vec<UserExtracted>,
    },
    Swap {},
    Transfer {},
    MultiTransfer {
        params: Vec<TransferParams>,
    },
}
