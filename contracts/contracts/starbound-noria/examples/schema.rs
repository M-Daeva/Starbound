use cosmwasm_schema::write_api;

use starbound_noria::messages::{
    execute::ExecuteMsg, instantiate::InstantiateMsg, other::MigrateMsg, query::QueryMsg,
};

fn main() {
    write_api! {
        instantiate: InstantiateMsg,
        query: QueryMsg,
        execute: ExecuteMsg,
        migrate: MigrateMsg,
    }
}
