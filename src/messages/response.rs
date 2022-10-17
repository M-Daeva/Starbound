use cosmwasm_std::{Coin, Decimal};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::state::{Asset, PoolExtracted, User, UserExtracted};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub struct QueryAssets {
    pub asset_list: Vec<Asset>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub struct QueryPoolsAndUsers {
    pub users: Vec<UserExtracted>,
    pub pools: Vec<PoolExtracted>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub struct DebugQueryPoolsAndUsers {
    pub users: Vec<User>,
    pub pools: Vec<PoolExtracted>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub struct DebugQueryBank {
    pub dapp_wallet: Vec<Coin>,
    pub global_delta_balance_list: Vec<u128>,
    pub global_delta_cost_list: Vec<u128>,
    pub global_denom_list: Vec<String>,
    pub global_price_list: Vec<Decimal>,
}
