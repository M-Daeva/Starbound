use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Decimal, Timestamp, Uint128};
use cw_storage_plus::{Item, Map};

use crate::actions::helpers::math::str_to_dec;

pub type Denom = String; // TODO: add verification
pub type AddrUnchecked = String;

pub const IBC_TIMEOUT_IN_MINS: u64 = 15;
pub const EXCHANGE_DENOM: &str = "uosmo";
pub const CHAIN_ID_DEV: &str = "devnet-1";

pub const CONFIG: Item<Config> = Item::new("config");
#[cw_serde]
pub struct Config {
    pub admin: Addr,
    pub scheduler: Addr,
    pub stablecoin_denom: Denom,
    pub stablecoin_pool_id: u64,
    pub fee_default: Decimal,
    pub fee_osmo: Decimal,
    pub dapp_address_and_denom_list: Vec<(Addr, Denom)>,
    pub timestamp: Timestamp,
    chain_id_dev: String,
}

impl Config {
    pub fn new(
        admin: &Addr,
        scheduler: &Addr,
        stablecoin_denom: &str,
        stablecoin_pool_id: u64,
        fee_default: &str,
        fee_osmo: &str,
    ) -> Self {
        Self {
            admin: admin.to_owned(),
            scheduler: scheduler.to_owned(),
            stablecoin_denom: stablecoin_denom.to_string(),
            stablecoin_pool_id,
            fee_default: str_to_dec(fee_default),
            fee_osmo: str_to_dec(fee_osmo),
            dapp_address_and_denom_list: vec![],
            timestamp: Timestamp::default(),
            chain_id_dev: String::from(CHAIN_ID_DEV),
        }
    }

    pub fn get_chain_id(&self) -> String {
        self.chain_id_dev.clone()
    }
}

pub const LEDGER: Item<Ledger> = Item::new("ledger");
#[cw_serde]
#[derive(Default)]
pub struct Ledger {
    pub global_delta_balance_list: Vec<Uint128>,
    pub global_delta_cost_list: Vec<Uint128>,
    pub global_denom_list: Vec<Denom>,
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
        Self {
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
#[derive(Default)]
pub struct User {
    pub asset_list: Vec<Asset>,
    pub is_rebalancing_used: bool,
    pub day_counter: Uint128,
    pub deposited: Uint128, // TODO: change Deposit msg
}

impl User {
    pub fn new(
        asset_list: &Vec<Asset>,
        day_counter: Uint128,
        deposited: Uint128,
        is_rebalancing_used: bool,
    ) -> Self {
        Self {
            is_rebalancing_used,
            asset_list: asset_list.to_owned(),
            day_counter,
            deposited,
        }
    }
}

#[cw_serde]
pub struct Asset {
    pub asset_denom: Denom,
    pub wallet_address: Addr,
    pub wallet_balance: Uint128,
    pub weight: Decimal,
    pub amount_to_transfer: Uint128,
}

impl Asset {
    pub fn new(
        asset_denom: &str,
        wallet_address: &Addr,
        wallet_balance: Uint128,
        weight: Decimal,
        amount_to_transfer: Uint128,
    ) -> Self {
        Self {
            asset_denom: asset_denom.to_string(),
            wallet_address: wallet_address.to_owned(),
            wallet_balance,
            weight,
            amount_to_transfer,
        }
    }
}

#[cw_serde]
pub struct TransferParams {
    pub channel_id: String,
    pub to: String,
    pub amount: Uint128,
    pub denom: Denom,
    pub block_revision: Uint128,
    pub block_height: Uint128,
    pub timestamp: Timestamp,
}
