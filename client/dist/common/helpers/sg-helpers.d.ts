import { Coin } from "@cosmjs/stargate";
import { DelegationStruct, IbcStruct, ClientStruct, SwapStruct } from "./interfaces";
import { PoolInfo } from "./interfaces";
declare function getSgHelpers(clientStruct: ClientStruct): Promise<{
    owner: string;
    _sgSwap: (swapStruct: SwapStruct) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    _sgTransfer: (ibcStruct: IbcStruct) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    _sgGrantStakeAuth: (delegationStruct: DelegationStruct) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    _sgDelegateFrom: (delegationStruct: DelegationStruct) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    _sgGetTokenBalances: (addr?: string) => Promise<{
        amount: string;
        symbol: string;
    }[]>;
    _sgUpdatePoolList: () => Promise<PoolInfo[]>;
    _sgSend: (recipient: string, amount: Coin) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
}>;
export { getSgHelpers };
