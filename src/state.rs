use cosmwasm_std::Addr;
use cw_storage_plus::{Item, Map};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

pub type AssetSymbol = String;
pub type AssetDenom = String;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct AssetInfo {
    pub asset_symbol: AssetSymbol,
    pub asset_denom: AssetDenom,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Pool {
    pub symbol_first: AssetSymbol,
    pub symbol_second: AssetSymbol,
    pub number: u32,
}

impl Pool {
    pub fn new(symbol_first: &str, symbol_second: &str, number: u32) -> Self {
        Pool {
            symbol_first: symbol_first.to_string(),
            symbol_second: symbol_second.to_string(),
            number,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct State {
    pub admin: Addr,
    pub pools: Vec<Pool>,
}

pub const STATE: Item<State> = Item::new("state");
pub const ASSET_DENOMS: Map<AssetSymbol, AssetDenom> = Map::new("asset_denoms");
