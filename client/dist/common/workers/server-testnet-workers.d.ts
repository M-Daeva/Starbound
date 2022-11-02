import { DelegationStruct, QueryPoolsAndUsersResponse, UserExtracted } from "../helpers/interfaces";
declare function init(): Promise<{
    _queryBalance: () => Promise<void>;
    cwSwap: () => Promise<void>;
    sgDelegateFrom: (stakeFromStruct: DelegationStruct) => Promise<void>;
    sgUpdatePoolList: () => Promise<void>;
    cwGetPools: () => Promise<void>;
    cwGetPrices: () => Promise<void>;
    cwDebugQueryPoolsAndUsers: () => Promise<void>;
    cwQueryPoolsAndUsers: () => Promise<QueryPoolsAndUsersResponse>;
    cwMockUpdatePoolsAndUsers: (poolsAndUsers: QueryPoolsAndUsersResponse) => Promise<void>;
    cwQueryAssets: () => Promise<void>;
    cwDebugQueryBank: () => Promise<void>;
    cwTransfer: () => Promise<void>;
    cwMultiTransfer: () => Promise<void>;
    sgTransfer: () => Promise<void>;
    cwSgSend: () => Promise<void>;
    sgSend: () => Promise<void>;
    sgDelegateFromAll: (users: UserExtracted[]) => Promise<void>;
}>;
export { init };
