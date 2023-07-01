use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Decimal, Uint128};
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
    pub terraswap_router: Addr,
    pub fee_rate: Decimal,
    chain_id_dev: String,
}

impl Config {
    pub fn new(
        admin: &Addr,
        scheduler: &Addr,
        terraswap_factory: &Addr,
        terraswap_router: &Addr,
        fee_rate: &str,
    ) -> Self {
        Self {
            admin: admin.to_owned(),
            scheduler: scheduler.to_owned(),
            terraswap_factory: terraswap_factory.to_owned(),
            terraswap_router: terraswap_router.to_owned(),
            fee_rate: str_to_dec(fee_rate),
            chain_id_dev: String::from(CHAIN_ID_DEV),
        }
    }

    pub fn get_chain_id(&self) -> String {
        self.chain_id_dev.clone()
    }
}

pub const LEDGER: Item<Ledger> = Item::new("ledger");

#[cw_serde]
pub struct Ledger {
    pub global_delta_balance_list: Vec<Uint128>,
    pub global_delta_cost_list: Vec<Uint128>,
    pub global_denom_list: Vec<terraswap::asset::AssetInfo>,
    pub global_price_list: Vec<Decimal>,
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
    pub info: terraswap::asset::AssetInfo,
    pub weight: Decimal,
    pub amount_to_transfer: Uint128,
}

impl Asset {
    pub fn new(info: &str, weight: Decimal) -> Self {
        let asset_info = if info.starts_with(PREFIX) {
            terraswap::asset::AssetInfo::Token {
                contract_addr: info.to_string(),
            }
        } else {
            terraswap::asset::AssetInfo::NativeToken {
                denom: info.to_string(),
            }
        };

        Self {
            info: asset_info,
            weight,
            amount_to_transfer: Uint128::zero(),
        }
    }
}
