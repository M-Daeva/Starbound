use std::env::current_dir;
use std::fs::create_dir_all;

use cosmwasm_schema::{export_schema, remove_schemas, schema_for};

use osmo_swapper::messages::{
    execute::ExecuteMsg,
    instantiate::InstantiateMsg,
    query::QueryMsg,
    response::{
        GetAllDenomsResponse, GetAllPoolsResponse, GetBankBalanceResponse, GetDenomResponse,
        GetUserInfoResponse,
    },
};

fn main() {
    let mut out_dir = current_dir().unwrap();
    out_dir.push("schema");
    create_dir_all(&out_dir).unwrap();
    remove_schemas(&out_dir).unwrap();

    export_schema(&schema_for!(InstantiateMsg), &out_dir);
    export_schema(&schema_for!(ExecuteMsg), &out_dir);
    export_schema(&schema_for!(QueryMsg), &out_dir);
    export_schema(&schema_for!(GetAllDenomsResponse), &out_dir);
    export_schema(&schema_for!(GetDenomResponse), &out_dir);
    export_schema(&schema_for!(GetAllPoolsResponse), &out_dir);
    export_schema(&schema_for!(GetBankBalanceResponse), &out_dir);
    export_schema(&schema_for!(GetUserInfoResponse), &out_dir);
}
