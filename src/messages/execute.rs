use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

// TODO: add messages to add pools and assets to storage

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    Deposit {},
    SwapTokens {
        from: String,
        to: String,
        amount: u128,
    },
}
