use cosmwasm_schema::cw_serde;
use cosmwasm_std::Binary;

#[cw_serde]
pub enum Ics20Ack {
    Result(Binary),
    Error(String),
}
