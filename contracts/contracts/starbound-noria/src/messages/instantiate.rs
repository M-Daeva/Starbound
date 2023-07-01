use cosmwasm_schema::cw_serde;

#[cw_serde]
pub struct InstantiateMsg {
    pub terraswap_factory: String,
    pub terraswap_router: String,
}
