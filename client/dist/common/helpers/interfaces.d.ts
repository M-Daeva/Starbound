import { Coin } from "@cosmjs/stargate";
import { Keplr } from "@keplr-wallet/types";
import Decimal from "decimal.js";
interface ClientStruct {
    isKeplrType: boolean;
    RPC: string;
    wallet?: Keplr;
    chainId?: string;
    seed?: string;
    prefix?: string;
}
interface IbcStruct {
    dstPrefix: string;
    sourceChannel: string;
    sourcePort: string;
    amount: number;
}
interface DelegationStruct {
    targetAddr: string;
    tokenAmount: number;
    tokenDenom: string;
    validatorAddr: string;
}
interface Asset {
    asset_denom: string;
    wallet_address: string;
    wallet_balance: string;
    weight: string;
    amount_to_send_until_next_epoch: string;
}
interface User {
    asset_list: Asset[];
    is_controlled_rebalancing: boolean;
    day_counter: string;
    deposited_on_current_period: string;
    deposited_on_next_period: string;
}
interface PoolExtracted {
    id: string;
    denom: string;
    price: string;
    symbol: string;
    channel_id: string;
    port_id: string;
}
interface UserExtracted {
    osmo_address: string;
    asset_list: AssetExtracted[];
}
interface AssetExtracted {
    asset_denom: string;
    wallet_address: string;
    wallet_balance: string;
}
interface QueryPoolsAndUsersResponse {
    users: UserExtracted[];
    pools: PoolExtracted[];
}
interface RelayerList {
    sendable: Relayer[];
}
interface RelayerTxStats {
    tx_num: {
        transfer: number;
        receive: number;
    };
    vol: {
        transfer: Coin[] | null;
        receive: Coin[] | null;
    };
}
interface Relayer {
    chain_id: string;
    paths: [
        {
            channel_id: string;
            port_id: string;
            channel_state: string;
            counter_party: {
                channel_id: string;
                port_id: string;
                channel_state: string;
            };
            stats: {
                current: RelayerTxStats;
                past: RelayerTxStats;
            };
            created_at: string;
        }
    ];
}
interface RelayerStruct {
    symbol: string;
    chain_id: string;
    channel_id: string;
    port_id: string;
    denom: string;
}
interface AssetDescription {
    symbol: string;
    amount: number;
    denom: string;
    coingecko_id: string;
    liquidity: number;
    liquidity_24h_change: number;
    volume_24h: number;
    volume_24h_change: number;
    volume_7d: number;
    price: number;
    fees: string;
    main: boolean;
}
interface PoolDatabase {
    [poolNumber: string]: AssetDescription[];
}
interface PoolInfoRaw {
    symbolFirst: string;
    symbolSecond: string;
    denomFirst: string;
    denomSecond: string;
    number: number;
}
interface PoolInfo {
    id: number;
    denom: string;
    price: Decimal;
}
interface PoolPair {
    symbolFirst: AssetSymbol;
    symbolSecond: AssetSymbol;
    number: number;
}
interface ChainsResponse {
    [chains: string]: string[];
}
interface ChainResponse {
    $schema: string;
    chain_name: string;
    status: string;
    network_type: string;
    pretty_name: string;
    chain_id: string;
    bech32_prefix: string;
    daemon_name: string;
    node_home: string;
    genesis: {
        genesis_url: string;
    };
    key_algos: string[];
    slip44: number;
    fees: {
        fee_tokens: {
            denom: string;
        }[];
    };
    codebase: {
        git_repo: string;
        recommended_version: string;
        compatible_versions: string[];
        binaries: {
            "linux/amd64": string;
            "linux/arm64": string;
            "darwin/amd64": string;
            "darwin/arm64": string;
            "windows/amd64": string;
        };
    };
    peers: {
        seeds: {
            id: string;
            address: string;
        }[];
        persistent_peers: {
            id: string;
            address: string;
            provider: string;
        }[];
    };
    apis: {
        rpc: {
            address: string;
            provider: string;
        }[];
        rest: {
            address: string;
            provider: string;
        }[];
        grpc: {
            address: string;
            provider: string;
        }[];
    };
    explorers: {
        kind: string;
        url: string;
        tx_page: string;
    }[];
}
interface Pagination {
    next_key: null;
    total: string;
}
interface BalancesResponse {
    balances: Coin[];
    pagination: Pagination;
}
interface DelegationsResponse {
    delegation_responses: {
        delegation: {
            delegator_address: string;
            validator_address: string;
            shares: string;
        };
        balance: Coin;
    }[];
    pagination: Pagination;
}
interface ValidatorListResponse {
    validators: ValidatorResponse[];
}
interface ValidatorResponse {
    operator_address: string;
    consensus_pubkey: {
        "@type": string;
        key: string;
    };
    jailed: boolean;
    status: string;
    tokens: string;
    delegator_shares: string;
    description: {
        moniker: string;
        identity: string;
        website: string;
        security_contact: string;
        details: string;
    };
    unbonding_height: string;
    unbonding_time: string;
    commission: {
        commission_rates: {
            rate: string;
            max_rate: string;
            max_change_rate: string;
        };
        update_time: string;
    };
    min_self_delegation: string;
}
interface SwapStruct {
    from: AssetSymbol;
    to: AssetSymbol;
    amount: number;
}
interface TransferParams {
    channel_id: string;
    to: string;
    amount: string;
    denom: string;
    block_revision: string;
    block_height: string;
}
declare type AssetDenom = {
    [assetSymbol in AssetSymbol]: string;
};
declare type AssetSymbol = "ATOM" | "OSMO" | "ION" | "AKT" | "DVPN" | "IRIS" | "CRO" | "XPRT" | "REGEN" | "NGM" | "EEUR" | "JUNO" | "LIKE" | "USTC" | "BCNA" | "BTSG" | "XKI" | "SCRT" | "MED" | "BOOT" | "CMDX" | "CHEQ" | "STARS" | "HUAHUA" | "LUM" | "DSM" | "GRAV" | "SOMM" | "ROWAN" | "NETA" | "UMEE" | "DEC" | "PSTAKE" | "DAI" | "USDC" | "MNTL" | "WETH" | "WBTC" | "EVMOS" | "TGD" | "DOT" | "ODIN" | "GLTO" | "GEO" | "BLD" | "CUDOS";
export { ClientStruct, DelegationStruct, IbcStruct, Asset, User, PoolExtracted, UserExtracted, AssetExtracted, QueryPoolsAndUsersResponse, RelayerList, Relayer, RelayerStruct, AssetDescription, PoolDatabase, PoolInfoRaw, PoolInfo, PoolPair, ChainsResponse, ChainResponse, BalancesResponse, DelegationsResponse, ValidatorListResponse, ValidatorResponse, AssetSymbol, AssetDenom, SwapStruct, TransferParams, };
