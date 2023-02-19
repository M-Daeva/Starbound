/**
* This file was automatically generated by @cosmwasm/ts-codegen@0.24.0.
* DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
* and run the @cosmwasm/ts-codegen generate command to regenerate this file.
*/
export interface InstantiateMsg {
}
export declare type ExecuteMsg = {
    deposit: {
        user: User;
    };
} | {
    withdraw: {
        amount: Uint128;
    };
} | {
    update_config: {
        dapp_address_and_denom_list?: [string, string][] | null;
        fee_default?: Decimal | null;
        fee_osmo?: Decimal | null;
        scheduler?: string | null;
        stablecoin_denom?: string | null;
        stablecoin_pool_id?: number | null;
    };
} | {
    update_pools_and_users: {
        pools: PoolExtracted[];
        users: UserExtracted[];
    };
} | {
    swap: {};
} | {
    transfer: {};
} | {
    multi_transfer: {
        params: TransferParams[];
    };
};
export declare type Uint128 = string;
export declare type Addr = string;
export declare type Decimal = string;
export declare type Timestamp = Uint64;
export declare type Uint64 = string;
export interface User {
    asset_list: Asset[];
    day_counter: Uint128;
    deposited: Uint128;
    is_controlled_rebalancing: boolean;
}
export interface Asset {
    amount_to_send_until_next_epoch: Uint128;
    asset_denom: string;
    wallet_address: Addr;
    wallet_balance: Uint128;
    weight: Decimal;
}
export interface PoolExtracted {
    channel_id: string;
    denom: string;
    id: Uint128;
    port_id: string;
    price: Decimal;
    symbol: string;
}
export interface UserExtracted {
    asset_list: AssetExtracted[];
    osmo_address: string;
}
export interface AssetExtracted {
    asset_denom: string;
    wallet_address: string;
    wallet_balance: Uint128;
}
export interface TransferParams {
    amount: Uint128;
    block_height: Uint128;
    block_revision: Uint128;
    channel_id: string;
    denom: string;
    timestamp: Timestamp;
    to: string;
}
export declare type QueryMsg = {
    query_user: {
        address: string;
    };
} | {
    query_pools_and_users: {};
} | {
    query_ledger: {};
} | {
    query_config: {};
};
export declare type MigrateMsg = string;
export interface QueryConfigResponse {
    config: Config;
}
export interface Config {
    admin: Addr;
    dapp_address_and_denom_list: [Addr, string][];
    fee_default: Decimal;
    fee_osmo: Decimal;
    scheduler: Addr;
    stablecoin_denom: string;
    stablecoin_pool_id: number;
    timestamp: Timestamp;
}
export interface QueryLedgerResponse {
    ledger: Ledger;
}
export interface Ledger {
    global_delta_balance_list: Uint128[];
    global_delta_cost_list: Uint128[];
    global_denom_list: string[];
    global_price_list: Decimal[];
}
export interface QueryPoolsAndUsersResponse {
    pools: PoolExtracted[];
    users: UserExtracted[];
}
export interface QueryUserResponse {
    user: User;
}