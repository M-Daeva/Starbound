use cosmwasm_std::{Addr, Coin};
use cw_storage_plus::{Item, Map};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct User {
    pub osmo_address: Addr,
    pub is_controlled_rebalancing: bool,
    pub asset_list: Vec<Asset>,
    pub block_counter: u128,
    pub deposited_on_current_period: u128,
    pub deposited_on_next_period: u128,
}

impl User {
    pub fn new(
        address: Addr,
        is_controlled_rebalancing: bool,
        deposited: Coin,
        is_current_period: bool,
    ) -> Self {
        const BLOCKS_PER_PERIOD: u128 = 421_680;
        let amount = deposited.amount.u128();
        let denom = deposited.denom;

        User {
            osmo_address: address.clone(),
            is_controlled_rebalancing,
            asset_list: vec![Asset::new(denom, address, amount, 0, 0)],
            block_counter: BLOCKS_PER_PERIOD,
            deposited_on_current_period: if is_current_period { amount } else { 0 },
            deposited_on_next_period: if !is_current_period { amount } else { 0 },
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct Asset {
    pub asset_symbol: AssetSymbol,
    pub wallet_address: Addr,
    pub wallet_balance: u128,
    pub k2: u128,
    pub amount_to_send_until_next_epoch: u128,
}

impl Asset {
    pub fn new(
        asset_symbol: AssetDenom,
        wallet_address: Addr,
        wallet_balance: u128,
        k2: u128,
        amount_to_send_until_next_epoch: u128,
    ) -> Self {
        Asset {
            asset_symbol,
            wallet_address,
            wallet_balance,
            k2,
            amount_to_send_until_next_epoch,
        }
    }
}

pub type AssetSymbol = String;
pub type AssetDenom = String;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct AssetInfo {
    pub asset_symbol: AssetSymbol,
    pub asset_denom: AssetDenom,
    pub price: u128,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct PoolInfo {
    pub symbol_first: AssetSymbol,
    pub symbol_second: AssetSymbol,
    pub number: u128,
}

impl PoolInfo {
    pub fn new(symbol_first: &str, symbol_second: &str, number: u128) -> Self {
        PoolInfo {
            symbol_first: symbol_first.to_string(),
            symbol_second: symbol_second.to_string(),
            number,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct State {
    pub admin: Addr,
    pub scheduler: Addr,
    pub pool_list: Vec<PoolInfo>,
}

pub const USERS: Map<Addr, User> = Map::new("users");
pub const STATE: Item<State> = Item::new("state");
pub const ASSET_DENOMS: Map<AssetSymbol, AssetDenom> = Map::new("asset_denoms");
