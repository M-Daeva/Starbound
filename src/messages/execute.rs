use crate::state::{PoolExtracted, TransferParams, User, UserExtracted};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
#[serde(rename_all = "snake_case")]
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
