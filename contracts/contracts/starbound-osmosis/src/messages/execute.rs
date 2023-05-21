use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Decimal, Uint128};

use crate::state::{PoolExtracted, TransferParams, User, UserExtracted};

#[cw_serde]
pub enum ExecuteMsg {
    Deposit {
        user: User,
    },
    Withdraw {
        amount: Uint128,
    },
    UpdateConfig {
        scheduler: Option<String>,
        stablecoin_denom: Option<String>,
        stablecoin_pool_id: Option<u64>,
        fee_default: Option<Decimal>,
        fee_osmo: Option<Decimal>,
        dapp_address_and_denom_list: Option<Vec<(String, String)>>,
    },
    UpdatePoolsAndUsers {
        pools: Vec<PoolExtracted>,
        users: Vec<UserExtracted>,
    },
    Swap {},
    Transfer {},
    MultiTransfer {
        params: Vec<TransferParams>,
    },
}
