import { QueryPoolsAndUsersResponse, UserExtracted, PoolExtracted } from "../../common/codegen/StarboundOsmosis.types";
import { ChainRegistryStorage, UpdateConfigStruct } from "../../common/interfaces";
declare function init(seed?: string): Promise<{
    sgGetPoolList: () => Promise<void>;
    cwQueryPoolsAndUsers: () => Promise<QueryPoolsAndUsersResponse>;
    cwQueryUser: (addr: string) => Promise<void>;
    cwQueryConfig: () => Promise<import("../../common/codegen/StarboundOsmosis.types").QueryConfigResponse | undefined>;
    owner?: undefined;
    cwSwap?: undefined;
    cwTransfer?: undefined;
    cwUpdatePoolsAndUsers?: undefined;
    sgSend?: undefined;
    sgDelegateFromAll?: undefined;
    cwUpdateConfig?: undefined;
} | {
    owner: string;
    cwSwap: (gasPrice: string) => Promise<void>;
    sgGetPoolList: () => Promise<void>;
    cwQueryPoolsAndUsers: () => Promise<QueryPoolsAndUsersResponse>;
    cwQueryUser: (addr: string) => Promise<void>;
    cwTransfer: (gasPrice: string) => Promise<void>;
    cwUpdatePoolsAndUsers: (pools: PoolExtracted[], users: UserExtracted[], gasPrice: string) => Promise<void>;
    sgSend: () => Promise<void>;
    sgDelegateFromAll: (denomGranterValoperList: [string, [string, string][]][], chainRegistryResponse: ChainRegistryStorage | undefined, chainType: "main" | "test", threshold?: number) => Promise<void>;
    cwQueryConfig: () => Promise<import("../../common/codegen/StarboundOsmosis.types").QueryConfigResponse | undefined>;
    cwUpdateConfig: (updateConfigStruct: UpdateConfigStruct, gasPrice: string) => Promise<import("@cosmjs/stargate").DeliverTxResponse | undefined>;
} | undefined>;
export { init };
