use cosmwasm_std::Addr;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::state::{Asset, AssetDenom, AssetInfo, PoolInfo};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub struct GetDenomResponse {
    pub denom: AssetDenom,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub struct GetAllDenomsResponse {
    pub all_assets_info: Vec<AssetInfo>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub struct GetAllPoolsResponse {
    pub all_pools: Vec<PoolInfo>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub struct GetUserInfoResponse {
    pub osmo_address: Addr,
    pub is_controlled_rebalancing: bool,
    pub asset_list: Vec<Asset>,
    pub block_counter: u128,
    pub deposited_on_current_period: u128,
    pub deposited_on_next_period: u128,
}
