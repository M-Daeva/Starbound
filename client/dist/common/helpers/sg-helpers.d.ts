import { Coin, StdFee } from "@cosmjs/stargate";
import { PoolInfo } from "./interfaces";
import { DelegationStruct, IbcStruct, ClientStruct, SwapStruct } from "./interfaces";
declare function getSgHelpers(clientStruct: ClientStruct): Promise<{
    owner: string;
    sgSwap: (swapStruct: SwapStruct) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    sgTransfer: (ibcStruct: IbcStruct) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    sgGrantStakeAuth: (delegationStruct: DelegationStruct) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    sgRevokeStakeAuth: (delegationStruct: DelegationStruct) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    sgDelegateFrom: (delegationStruct: DelegationStruct, specifiedFee?: StdFee) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    sgGetTokenBalances: (addr?: string) => Promise<{
        amount: string;
        symbol: string;
    }[]>;
    sgUpdatePoolList: () => Promise<PoolInfo[]>;
    sgSend: (recipient: string, amount: Coin) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    sgDelegateFromList: (delegationStructList: DelegationStruct[], gasPrice: string) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
}>;
export { getSgHelpers };
