use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Decimal, Uint128};

#[cw_serde]
pub enum ExecuteMsg {
    Deposit {
        asset_list: Option<Vec<(String, Decimal)>>,
        is_rebalancing_used: Option<bool>,
        down_counter: Option<Uint128>,
    },
    Withdraw {
        amount: Uint128,
    },
    UpdateConfig {
        scheduler: Option<String>,
        terraswap_factory: Option<String>,
        terraswap_router: Option<String>,
        fee_rate: Option<Decimal>,
    },
    Swap {},
    Transfer {},
}
