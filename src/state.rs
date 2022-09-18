use cosmwasm_std::{Addr, Coin, Uint128};
use cw_storage_plus::{Item, Map};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

// TODO: add portfolio structures storage

pub type AssetSymbol = String;
pub type AssetDenom = String;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct AssetInfo {
    pub asset_symbol: AssetSymbol,
    pub asset_denom: AssetDenom,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct Pool {
    pub symbol_first: AssetSymbol,
    pub symbol_second: AssetSymbol,
    pub number: u128,
}

impl Pool {
    pub fn new(symbol_first: &str, symbol_second: &str, number: u128) -> Self {
        Pool {
            symbol_first: symbol_first.to_string(),
            symbol_second: symbol_second.to_string(),
            number,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct User {
    pub address: Addr,
    pub deposited: Uint128,
    pub portfolio: Vec<Coin>,
}

impl User {
    pub fn new(address: Addr) -> Self {
        User {
            address,
            deposited: Uint128::new(0),
            portfolio: Vec::<Coin>::new(),
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct Bank {
    pub address: Addr,
    pub balance: Vec<Coin>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct State {
    pub admin: Addr,
    pub pools: Vec<Pool>,
}

pub const STATE: Item<State> = Item::new("state");
pub const BANK: Item<Bank> = Item::new("bank");
pub const ASSET_DENOMS: Map<AssetSymbol, AssetDenom> = Map::new("asset_denoms");
pub const USERS: Map<Addr, User> = Map::new("users");
