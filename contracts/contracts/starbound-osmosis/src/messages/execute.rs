use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Decimal, Uint128};

use crate::state::{AddrUnchecked, Denom, Pool, TransferParams, User};

#[cw_serde]
pub enum ExecuteMsg {
    Deposit {
        user: User,
    },
    Withdraw {
        amount: Uint128,
    },
    UpdateConfig {
        scheduler: Option<AddrUnchecked>,
        stablecoin_denom: Option<Denom>,
        stablecoin_pool_id: Option<u64>,
        fee_default: Option<Decimal>,
        fee_osmo: Option<Decimal>,
        dapp_address_and_denom_list: Option<Vec<(AddrUnchecked, Denom)>>,
    },
    UpdatePoolsAndUsers {
        pools: Vec<(Denom, Pool)>,
        users: Vec<(AddrUnchecked, User)>,
    },
    Swap {},
    Transfer {},
    MultiTransfer {
        params: Vec<TransferParams>,
    },
}
