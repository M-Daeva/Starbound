import { DelegationStruct } from "../interfaces";
import { DirectSecp256k1HdWallet, OfflineSigner, OfflineDirectSigner } from "@cosmjs/proto-signing";
import { Coin, StdFee } from "@cosmjs/stargate";
declare function getSgExecHelpers(rpc: string, owner: string, signer: (OfflineSigner & OfflineDirectSigner) | DirectSecp256k1HdWallet): Promise<{
    sgGrantStakeAuth: (delegationStruct: DelegationStruct) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    sgRevokeStakeAuth: (delegationStruct: DelegationStruct) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    sgDelegateFrom: (delegationStruct: DelegationStruct, specifiedFee?: StdFee) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    sgSend: (recipient: string, amount: Coin) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    sgDelegateFromList: (delegationStructList: DelegationStruct[], gasPrice: string) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
} | undefined>;
declare function getSgQueryHelpers(rpc: string): Promise<{
    getAllBalances: (address: string) => Promise<readonly import("cosmjs-types/cosmos/base/v1beta1/coin").Coin[]>;
} | undefined>;
export { getSgExecHelpers, getSgQueryHelpers };
