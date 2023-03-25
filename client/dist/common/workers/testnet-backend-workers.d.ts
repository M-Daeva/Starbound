import { QueryPoolsAndUsersResponse, UserExtracted, PoolExtracted } from "../codegen/Starbound.types";
import { DelegationStruct, ChainRegistryStorage, UpdateConfigStruct } from "../helpers/interfaces";
declare function init(seed: string): Promise<{
    _queryBalance: () => Promise<void>;
    cwSwap: (gasPrice: string) => Promise<void>;
    sgDelegateFrom: (stakeFromStruct: DelegationStruct) => Promise<void>;
    sgUpdatePoolList: () => Promise<void>;
    cwQueryPoolsAndUsers: () => Promise<QueryPoolsAndUsersResponse>;
    cwMockUpdatePoolsAndUsers: (poolsAndUsers: QueryPoolsAndUsersResponse, gasPrice: string) => Promise<void>;
    cwQueryUser: () => Promise<void>;
    cwTransfer: (gasPrice: string) => Promise<void>;
    cwUpdatePoolsAndUsers: (pools: PoolExtracted[], users: UserExtracted[], gasPrice: string) => Promise<void>;
    sgTransfer: () => Promise<void>;
    sgSend: () => Promise<void>;
    sgDelegateFromAll: (denomGranterValoperList: [string, [string, string][]][], chainRegistryResponse: ChainRegistryStorage | undefined, chainType: "main" | "test", threshold?: number) => Promise<void>;
    cwQueryConfig: () => Promise<import("../codegen/Starbound.types").QueryConfigResponse | undefined>;
    cwUpdateConfig: (updateConfigStruct: UpdateConfigStruct, gasPrice: string) => Promise<import("@cosmjs/stargate").DeliverTxResponse | undefined>;
} | undefined>;
export { init };
