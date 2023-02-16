import { ValidatorsStorage } from "../../common/helpers/interfaces";
declare function updateChainRegistry(): Promise<{
    fn: string;
    isStorageUpdated: boolean;
}>;
declare function getChainRegistry(): Promise<import("../../common/helpers/interfaces").NetworkData[]>;
declare function updateIbcChannels(): Promise<{
    fn: string;
    isStorageUpdated: boolean;
}>;
declare function getIbcChannnels(): Promise<import("../../common/helpers/interfaces").IbcResponse[]>;
declare function updatePools(): Promise<{
    fn: string;
    isStorageUpdated: boolean;
}>;
declare function getPools(): Promise<[string, import("../../common/helpers/interfaces").AssetDescription[]][]>;
declare function updateValidators(): Promise<{
    fn: string;
    isStorageUpdated: boolean;
}>;
declare function getValidators(): Promise<ValidatorsStorage | undefined>;
declare function updateUserFunds(): Promise<{
    fn: string;
    isStorageUpdated: boolean;
}>;
declare function getUserFunds(userOsmoAddress: string): Promise<[string, import("../../common/helpers/interfaces").UserBalance][]>;
declare function updatePoolsAndUsers(): Promise<{
    fn: string;
    isStorageUpdated: boolean;
}>;
declare function getPoolsAndUsers(): Promise<import("../../common/codegen/Starbound.types").QueryPoolsAndUsersResponse | undefined>;
declare function filterChainRegistry(): Promise<{
    chainRegistry: import("../../common/helpers/interfaces").NetworkData[];
    ibcChannels: import("../../common/helpers/interfaces").IbcResponse[];
    pools: [string, import("../../common/helpers/interfaces").AssetDescription[]][];
    activeNetworks: import("../../common/codegen/Starbound.types").PoolExtracted[];
}>;
declare function updateAll(): Promise<{
    fn: string;
    isStorageUpdated: boolean;
}[]>;
declare function getAll(userOsmoAddress: string): Promise<{
    activeNetworks: import("../../common/codegen/Starbound.types").PoolExtracted[];
    chainRegistry: import("../../common/helpers/interfaces").NetworkData[];
    ibcChannels: import("../../common/helpers/interfaces").IbcResponse[];
    pools: [string, import("../../common/helpers/interfaces").AssetDescription[]][];
    validatorsStorage: ValidatorsStorage | undefined;
    userFunds: [string, import("../../common/helpers/interfaces").UserBalance][];
}>;
export { updateChainRegistry, getChainRegistry, updateIbcChannels, getIbcChannnels, updatePools, getPools, updateValidators, getValidators, updateUserFunds, getUserFunds, updatePoolsAndUsers, getPoolsAndUsers, filterChainRegistry, updateAll, getAll, };
