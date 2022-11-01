use cosmwasm_schema::write_api;

use starbound::messages::{
    execute::ExecuteMsg, instantiate::InstantiateMsg, migrate::MigrateMsg, query::QueryMsg,
};

fn main() {
    write_api! {
        instantiate: InstantiateMsg,
        query: QueryMsg,
        execute: ExecuteMsg,
        migrate: MigrateMsg,
    }
}
