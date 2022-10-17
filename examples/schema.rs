use std::env::current_dir;
use std::fs::create_dir_all;

use cosmwasm_schema::{export_schema, remove_schemas, schema_for};

use starbound::messages::{
    execute::ExecuteMsg,
    instantiate::InstantiateMsg,
    query::QueryMsg,
    response::{DebugQueryBank, DebugQueryPoolsAndUsers, QueryAssets, QueryPoolsAndUsers},
};

fn main() {
    let mut out_dir = current_dir().unwrap();
    out_dir.push("schema");
    create_dir_all(&out_dir).unwrap();
    remove_schemas(&out_dir).unwrap();
    export_schema(&schema_for!(InstantiateMsg), &out_dir);
    export_schema(&schema_for!(ExecuteMsg), &out_dir);
    export_schema(&schema_for!(QueryMsg), &out_dir);
    export_schema(&schema_for!(QueryAssets), &out_dir);
    export_schema(&schema_for!(QueryPoolsAndUsers), &out_dir);
    export_schema(&schema_for!(DebugQueryPoolsAndUsers), &out_dir);
    export_schema(&schema_for!(DebugQueryBank), &out_dir);
}
