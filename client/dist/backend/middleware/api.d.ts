import { ValidatorsStorage } from "../../common/interfaces";
declare function updateChainRegistry(): Promise<{
    fn: string;
    updateStatus: string;
}>;
declare function getChainRegistry(): Promise<import("../../common/interfaces").NetworkData[]>;
declare function updateIbcChannels(): Promise<{
    fn: string;
    updateStatus: string;
}>;
declare function getIbcChannnels(): Promise<import("../../common/interfaces").IbcResponse[]>;
declare function updatePools(): Promise<{
    fn: string;
    updateStatus: string;
}>;
declare function getPools(): Promise<[string, import("../../common/interfaces").AssetDescription[]][]>;
declare function updateValidators(): Promise<{
    fn: string;
    updateStatus: string;
}>;
declare function getValidators(): Promise<ValidatorsStorage | undefined>;
declare function updateUserFunds(): Promise<{
    fn: string;
    updateStatus: string;
}>;
declare function getUserFunds(userOsmoAddress: string): Promise<[string, import("../../common/interfaces").UserBalance][]>;
declare function updatePoolsAndUsers(): Promise<{
    fn: string;
    updateStatus: string;
}>;
declare function getPoolsAndUsers(): Promise<import("../../common/codegen/StarboundOsmosis.types").QueryPoolsAndUsersResponse | undefined>;
declare function filterChainRegistry(): Promise<{
    chainRegistry: import("../../common/interfaces").NetworkData[];
    ibcChannels: import("../../common/interfaces").IbcResponse[];
    pools: [string, import("../../common/interfaces").AssetDescription[]][];
    activeNetworks: import("../../common/codegen/StarboundOsmosis.types").PoolExtracted[];
}>;
declare function updateAll(): Promise<{
    fn: string;
    updateStatus: string;
}[]>;
declare function getAll(userOsmoAddress?: string): Promise<{
    activeNetworks: import("../../common/codegen/StarboundOsmosis.types").PoolExtracted[];
    chainRegistry: import("../../common/interfaces").NetworkData[];
    ibcChannels: import("../../common/interfaces").IbcResponse[];
    pools: [string, import("../../common/interfaces").AssetDescription[]][];
    validatorsStorage: ValidatorsStorage | undefined;
    userFunds: [string, import("../../common/interfaces").UserBalance][];
}>;
export { updateChainRegistry, getChainRegistry, updateIbcChannels, getIbcChannnels, updatePools, getPools, updateValidators, getValidators, updateUserFunds, getUserFunds, updatePoolsAndUsers, getPoolsAndUsers, filterChainRegistry, updateAll, getAll, };
