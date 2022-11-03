import { DelegationStruct, User } from "../helpers/interfaces";
declare function init(): Promise<{
    sgGrantStakeAuth: (grantStakeStruct: DelegationStruct) => Promise<import("@cosmjs/stargate").DeliverTxResponse | undefined>;
    cwDeposit: (userAlice: User) => Promise<readonly import("@cosmjs/cosmwasm-stargate").Attribute[] | undefined>;
    cwWithdraw: (amount: number) => Promise<readonly import("@cosmjs/cosmwasm-stargate").Attribute[] | undefined>;
    cwDebugQueryBank: () => Promise<void>;
    cwQueryPoolsAndUsers: () => Promise<import("../helpers/interfaces").QueryPoolsAndUsersResponse | undefined>;
    cwDebugQueryPoolsAndUsers: () => Promise<{
        pools: import("../helpers/interfaces").PoolExtracted[];
        users: User[];
    } | undefined>;
    cwQueryAssets: (address: string) => Promise<{
        asset_list: import("../helpers/interfaces").Asset[];
    } | undefined>;
    owner: string;
}>;
export { init };
