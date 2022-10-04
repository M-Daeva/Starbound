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
    Transfer {
        receiver_addr: String,
        channel_id: String,
        token_amount: u128,
        token_symbol: String,
    },
}
