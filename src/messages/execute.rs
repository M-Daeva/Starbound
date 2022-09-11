use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

// use crate::state::Pool;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    Deposit {},
    SwapTokens {
        from: String,
        to: String,
        amount: u128,
    },
    // AddPools { pools: Vec<Pool> },
    // RemovePools { pools: Vec<Pool> },
}
