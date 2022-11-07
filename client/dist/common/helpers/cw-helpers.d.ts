import { ClientStruct, User, PoolExtracted, UserExtracted, QueryPoolsAndUsersResponse, Asset, TransferParams } from "./interfaces";
declare function getCwHelpers(clientStruct: ClientStruct, contractAddress: string): Promise<{
    owner: string;
    _cwGetBankBalance: () => Promise<void>;
    _cwDeposit: (tokenAmount: number) => Promise<void>;
    _cwTransfer: () => Promise<void>;
    _cwSwap: () => Promise<void>;
    _cwGetPools: () => Promise<void>;
    _cwGetPrices: () => Promise<void>;
    _cwDebugQueryPoolsAndUsers: () => Promise<{
        pools: PoolExtracted[];
        users: User[];
    }>;
    _cwQueryPoolsAndUsers: () => Promise<QueryPoolsAndUsersResponse>;
    _cwDepositNew: (user: User) => Promise<readonly import("@cosmjs/stargate").Attribute[]>;
    _cwWithdrawNew: (tokenAmount: number) => Promise<readonly import("@cosmjs/stargate").Attribute[]>;
    _cwUpdatePoolsAndUsers: (pools: PoolExtracted[], users: UserExtracted[]) => Promise<void>;
    _cwQueryAssets: (address: string) => Promise<{
        asset_list: Asset[];
    }>;
    _cwDebugQueryBank: () => Promise<void>;
    _cwMultiTransfer: (transferParams: TransferParams[]) => Promise<void>;
    _cwSgSend: () => Promise<void>;
}>;
export { getCwHelpers };
