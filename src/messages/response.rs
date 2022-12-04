use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Coin, Decimal, Uint128};

use crate::state::{Asset, PoolExtracted, User, UserExtracted};

#[cw_serde]
pub struct QueryAssetsResponse {
    pub asset_list: Vec<Asset>,
}

#[cw_serde]
pub struct QueryPoolsAndUsersResponse {
    pub users: Vec<UserExtracted>,
    pub pools: Vec<PoolExtracted>,
}

#[cw_serde]
pub struct DebugQueryPoolsAndUsersResponse {
    pub users: Vec<User>,
    pub pools: Vec<PoolExtracted>,
}

#[cw_serde]
pub struct DebugQueryBankResponse {
    pub dapp_wallet: Vec<Coin>,
    pub global_delta_balance_list: Vec<Uint128>,
    pub global_delta_cost_list: Vec<Uint128>,
    pub global_denom_list: Vec<String>,
    pub global_price_list: Vec<Decimal>,
}
