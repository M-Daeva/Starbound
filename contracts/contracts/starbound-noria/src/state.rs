use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Decimal, Timestamp, Uint128};
use cw_storage_plus::{Item, Map};

use crate::actions::helpers::math::str_to_dec;

pub const PREFIX: &str = "noria";
pub const DENOM_STABLE: &str = "ucrd";
pub const CHAIN_ID_DEV: &str = "devnet-1";

pub const CONFIG: Item<Config> = Item::new("config");
#[cw_serde]
pub struct Config {
    pub admin: Addr,
    pub scheduler: Addr,
    pub terraswap_factory: Addr,
    pub fee_rate: Decimal,
    pub timestamp: Timestamp,
    chain_id_dev: String,
}

impl Config {
    pub fn new(admin: &Addr, scheduler: &Addr, terraswap_factory: &Addr, fee_rate: &str) -> Self {
        Self {
            admin: admin.to_owned(),
            scheduler: scheduler.to_owned(),
            terraswap_factory: terraswap_factory.to_owned(),
            fee_rate: str_to_dec(fee_rate),
            timestamp: Timestamp::default(),
            chain_id_dev: String::from(CHAIN_ID_DEV),
        }
    }

    pub fn get_chain_id(&self) -> String {
        self.chain_id_dev.clone()
    }
}

// key - native_address: &Addr
pub const USERS: Map<&Addr, User> = Map::new("users");
#[cw_serde]
#[derive(Default)]
pub struct User {
    pub asset_list: Vec<Asset>,
    pub is_rebalancing_used: bool,
    pub down_counter: Uint128,
    pub stable_balance: Uint128,
}

impl User {
    pub fn new(
        asset_list: &Vec<Asset>,
        down_counter: Uint128,
        stable_balance: Uint128,
        is_rebalancing_used: bool,
    ) -> Self {
        Self {
            is_rebalancing_used,
            asset_list: asset_list.to_owned(),
            down_counter,
            stable_balance,
        }
    }
}

#[cw_serde]
pub struct Asset {
    pub contract: Addr, // TODO: rename to denom and support both cw20 and native assets
    pub weight: Decimal,
}

impl Asset {
    pub fn new(contract: &Addr, weight: Decimal) -> Self {
        Self {
            contract: contract.to_owned(),
            weight,
        }
    }
}
