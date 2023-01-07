import { Coin, DeliverTxResponse } from "@cosmjs/stargate";
import { Keplr } from "@keplr-wallet/types";
import Decimal from "decimal.js";
import { QueryPoolsAndUsersResponse } from "../../common/codegen/Starbound.types";

// TODO: split to different files for better navigation

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

// TODO: rename
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

interface ValidatorResponseReduced {
  operator_address: string;
  moniker: string;
}

interface IbcResponse {
  source: string;
  destination: string;
  channel_id: string;
  token_symbol: string;
  token_name: string;
  token_liquidity: number;
  last_tx: string;
  size_queue: number;
  duration_minutes: number;
}

interface SwapStruct {
  from: AssetSymbol;
  to: AssetSymbol;
  amount: number;
}

interface NetworkData {
  prefix: string;
  main?: ChainResponse;
  test?: ChainResponse;
  img: string;
  symbol: string;
  exponent: number;
  denomNative: string;
  denomIbc: string;
  coinGeckoId?: string;
}

interface AuthzHandler {
  symbol: string;
  grant: () => Promise<DeliverTxResponse>;
  revoke: () => Promise<DeliverTxResponse>;
}

interface UserBalance {
  holded: Coin;
  staked: Coin;
}

interface UserAdressesWithBalances {
  osmoAddr: string;
  assetList: { address: string; holded: Coin; staked: Coin }[];
}

interface DashboardAsset {
  asset: string;
  price: Decimal;
  holded: Decimal;
  staked: Decimal;
  cost: Decimal;
  allocation: Decimal;
}

interface AssetList {
  $schema: string;
  chain_name: string;
  assets: {
    description: string;
    denom_units: {
      denom: string;
      exponent: number;
      aliases: string[];
    }[];
    base: string;
    name: string;
    display: string;
    symbol: string;
    logo_URIs: {
      png: string;
      svg?: string;
    };
    coingecko_id: string;
    keywords: string[];
  }[];
}

interface NetworkContentResponse {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: null;
  type: string;
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

interface IbcTracesResponse {
  denom_traces: {
    path: string;
    base_denom: string;
  }[];
  pagination: Pagination;
}

interface IbcAckResponse {
  acknowledgements: {
    port_id: string;
    channel_id: string;
    sequence: string;
    data: string;
  }[];
  pagination: Pagination;
  height: {
    revision_number: string;
    revision_height: string;
  };
}

interface AssetListItem {
  asset: { logo: string; symbol: string };
  address: string;
  ratio: number;
  validator: string;
}

type AssetDenom = {
  [assetSymbol in AssetSymbol]: string;
};

type AssetSymbol =
  | "ATOM"
  | "OSMO"
  | "ION"
  | "AKT"
  | "DVPN"
  | "IRIS"
  | "CRO"
  | "XPRT"
  | "REGEN"
  | "NGM"
  | "EEUR"
  | "JUNO"
  | "LIKE"
  | "USTC"
  | "BCNA"
  | "BTSG"
  | "XKI"
  | "SCRT"
  | "MED"
  | "BOOT"
  | "CMDX"
  | "CHEQ"
  | "STARS"
  | "HUAHUA"
  | "LUM"
  | "DSM"
  | "GRAV"
  | "SOMM"
  | "ROWAN"
  | "NETA"
  | "UMEE"
  | "DEC"
  | "PSTAKE"
  | "DAI"
  | "USDC"
  | "MNTL"
  | "WETH"
  | "WBTC"
  | "EVMOS"
  | "TGD"
  | "DOT"
  | "ODIN"
  | "GLTO"
  | "GEO"
  | "BLD"
  | "CUDOS";

type StorageNames =
  | "chain-registry-storage"
  | "ibc-channels-storage"
  | "pools-storage"
  | "validators-storage"
  | "user-funds-storage"
  | "pools-and-users-storage";

type ChainRegistryStorage = NetworkData[];
type IbcChannelsStorage = IbcResponse[];
type PoolsStorage = [string, AssetDescription[]][];
type ValidatorsStorage = [string, ValidatorResponseReduced[]][];
type UserFundsStorage = [string, UserBalance][];
type PoolsAndUsersStorage = QueryPoolsAndUsersResponse;

type StorageTypes =
  | ChainRegistryStorage
  | IbcChannelsStorage
  | PoolsStorage
  | ValidatorsStorage
  | UserFundsStorage
  | PoolsAndUsersStorage;

export type { NetworkData };

export {
  AssetListItem,
  AssetList,
  ClientStruct,
  DelegationStruct,
  IbcStruct,
  RelayerList,
  Relayer,
  RelayerStruct,
  AssetDescription,
  PoolDatabase,
  PoolInfoRaw,
  PoolInfo,
  PoolPair,
  ChainsResponse,
  ChainResponse,
  BalancesResponse,
  DelegationsResponse,
  ValidatorListResponse,
  ValidatorResponse,
  ValidatorResponseReduced,
  IbcResponse,
  AssetSymbol,
  AssetDenom,
  SwapStruct,
  AuthzHandler,
  UserBalance,
  UserAdressesWithBalances,
  DashboardAsset,
  NetworkContentResponse,
  StorageNames,
  ChainRegistryStorage,
  IbcChannelsStorage,
  PoolsStorage,
  ValidatorsStorage,
  UserFundsStorage,
  PoolsAndUsersStorage,
  StorageTypes,
  IbcTracesResponse,
  IbcAckResponse,
};
