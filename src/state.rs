use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Decimal, IbcEndpoint, Uint128, Uint64};
use cw_storage_plus::{Item, Map};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

pub const STATE: Item<State> = Item::new("state");

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct State {
    pub admin: Addr,
    pub scheduler: Addr,
    pub global_delta_balance_list: Vec<u128>,
    pub global_delta_cost_list: Vec<u128>,
    pub global_denom_list: Vec<String>,
    pub global_price_list: Vec<Decimal>,
}

// key - denom: &str
pub const POOLS: Map<&str, Pool> = Map::new("pools");

// TODO: update structure
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct Pool {
    pub id: u128,
    pub price: Decimal,
    pub symbol: String,
    pub channel_id: String,
    pub port_id: String,
}

impl Pool {
    pub fn new(id: u128, price: Decimal, channel_id: &str, port_id: &str, symbol: &str) -> Self {
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

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct User {
    pub asset_list: Vec<Asset>,
    pub is_controlled_rebalancing: bool,
    pub day_counter: u128,
    pub deposited_on_current_period: u128,
    pub deposited_on_next_period: u128,
}

impl User {
    pub fn default() -> Self {
        User {
            is_controlled_rebalancing: true,
            asset_list: Vec::<Asset>::new(),
            day_counter: 30,
            deposited_on_current_period: 0,
            deposited_on_next_period: 0,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct Asset {
    pub asset_denom: String,
    pub wallet_address: Addr,
    pub wallet_balance: u128,
    pub weight: Decimal,
    pub amount_to_send_until_next_epoch: u128,
}

impl Asset {
    pub fn new(
        asset_denom: &str,
        wallet_address: &Addr,
        wallet_balance: u128,
        weight: Decimal,
        amount_to_send_until_next_epoch: u128,
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

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct PoolExtracted {
    pub id: u128,
    pub denom: String,
    pub price: Decimal,
    pub symbol: String,
    pub channel_id: String,
    pub port_id: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct UserExtracted {
    pub osmo_address: String,
    pub asset_list: Vec<AssetExtracted>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct AssetExtracted {
    pub asset_denom: String,
    pub wallet_address: String,
    pub wallet_balance: u128,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct TransferParams {
    pub channel_id: String,
    pub to: String,
    pub amount: u128,
    pub denom: String,
    pub block_revision: u128,
    pub block_height: u128,
}

// IBC

pub const CHANNEL_INFO: Map<&str, ChannelInfo> = Map::new("channel_info");
#[cw_serde]
pub struct ChannelInfo {
    /// id of this channel
    pub id: String,
    /// the remote channel/port we connect to
    pub counterparty_endpoint: IbcEndpoint,
    /// the connection this exists on (you can use to query client/consensus info)
    pub connection_id: String,
}

pub const ORDERS: Map<(&str, u64), Order> = Map::new("swap_orders");
#[cw_serde]
pub struct Order {
    pub sender: String,
    pub amount: Uint128,
    pub denom: String,
    pub out_denom: String,
    pub min_amount: Uint128,
    /// Transfer sequence
    pub sequence: Uint64,
}

pub const REPLY_STATES: Map<u64, MsgReplyState> = Map::new("reply_states");
#[cw_serde]
pub struct MsgReplyState {
    pub channel: String,
}

pub const CHANNEL_DENOM: Map<&str, String> = Map::new("channel_denom");
