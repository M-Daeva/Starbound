use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Decimal, Timestamp, Uint128};
use cw_storage_plus::{Item, Map};

pub const CONFIG: Item<Config> = Item::new("config");

#[cw_serde]
pub struct Config {
    pub admin: Addr,
    pub scheduler: Addr,
    pub stablecoin_denom: String,
    pub stablecoin_pool_id: u64,
    pub fee_default: Decimal,
    pub fee_osmo: Decimal,
    pub dapp_address_and_denom_list: Vec<(Addr, String)>,
    pub timestamp: Timestamp,
}

pub const LEDGER: Item<Ledger> = Item::new("ledger");

#[cw_serde]
pub struct Ledger {
    pub global_delta_balance_list: Vec<Uint128>,
    pub global_delta_cost_list: Vec<Uint128>,
    pub global_denom_list: Vec<String>,
    pub global_price_list: Vec<Decimal>,
}

// key - denom: &str
pub const POOLS: Map<&str, Pool> = Map::new("pools");

#[cw_serde]
pub struct Pool {
    pub id: Uint128,
    pub price: Decimal,
    pub symbol: String,
    pub channel_id: String,
    pub port_id: String,
}

impl Pool {
    pub fn new(id: Uint128, price: Decimal, channel_id: &str, port_id: &str, symbol: &str) -> Self {
        Pool {
            id,
            price,
            channel_id: channel_id.to_string(),
            port_id: port_id.to_string(),
            symbol: symbol.to_string(),
        }
    }
}

// key - osmo_address: &Addr
pub const USERS: Map<&Addr, User> = Map::new("users");

#[cw_serde]
pub struct User {
    pub asset_list: Vec<Asset>,
    pub is_controlled_rebalancing: bool,
    pub day_counter: Uint128,
    pub deposited: Uint128,
}

impl User {
    pub fn new(
        asset_list: &Vec<Asset>,
        day_counter: Uint128,
        deposited: Uint128,

        is_controlled_rebalancing: bool,
    ) -> Self {
        User {
            is_controlled_rebalancing,
            asset_list: asset_list.to_owned(),
            day_counter,
            deposited,
        }
    }
}

#[cw_serde]
pub struct Asset {
    pub asset_denom: String,
    pub wallet_address: Addr,
    pub wallet_balance: Uint128,
    pub weight: Decimal,
    pub amount_to_send_until_next_epoch: Uint128,
}

impl Asset {
    pub fn new(
        asset_denom: &str,
        wallet_address: &Addr,
        wallet_balance: Uint128,
        weight: Decimal,
        amount_to_send_until_next_epoch: Uint128,
    ) -> Self {
        Asset {
            asset_denom: asset_denom.to_string(),
            wallet_address: wallet_address.to_owned(),
            wallet_balance,
            weight,
            amount_to_send_until_next_epoch,
        }
    }

    pub fn extract(&self) -> AssetExtracted {
        AssetExtracted {
            asset_denom: self.asset_denom.to_string(),
            wallet_address: self.wallet_address.to_string(),
            wallet_balance: self.wallet_balance,
        }
    }
}

#[cw_serde]
pub struct PoolExtracted {
    pub id: Uint128,
    pub denom: String,
    pub price: Decimal,
    pub symbol: String,
    pub channel_id: String,
    pub port_id: String,
}

impl PoolExtracted {
    pub fn slice(&self) -> Pool {
        Pool::new(
            self.id,
            self.price,
            &self.channel_id,
            &self.port_id,
            &self.symbol,
        )
    }
}

#[cw_serde]
pub struct UserExtracted {
    pub osmo_address: String,
    pub asset_list: Vec<AssetExtracted>,
}

#[cw_serde]
pub struct AssetExtracted {
    pub asset_denom: String,
    pub wallet_address: String,
    pub wallet_balance: Uint128,
}

#[cw_serde]
pub struct TransferParams {
    pub channel_id: String,
    pub to: String,
    pub amount: Uint128,
    pub denom: String,
    pub block_revision: Uint128,
    pub block_height: Uint128,
    pub timestamp: Timestamp,
}
