import { UpdateConfigStruct } from "../interfaces";
import { DirectSecp256k1HdWallet, OfflineSigner, OfflineDirectSigner } from "@cosmjs/proto-signing";
import { User, PoolExtracted, UserExtracted, TransferParams } from "../codegen/StarboundOsmosis.types";
declare function getCwExecHelpers(contractAddress: string, rpc: string, owner: string, signer: (OfflineSigner & OfflineDirectSigner) | DirectSecp256k1HdWallet): Promise<{
    cwDeposit: (user: User) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    cwWithdraw: (tokenAmount: number) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    cwUpdateConfig: (updateConfigStruct: UpdateConfigStruct, gasPrice: string) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    cwUpdatePoolsAndUsers: (pools: PoolExtracted[], users: UserExtracted[], gasPrice: string) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    cwSwap: (gasPrice: string) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    cwTransfer: (gasPrice: string) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    cwMultiTransfer: (params: TransferParams[]) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
} | undefined>;
declare function getCwQueryHelpers(contractAddress: string, rpc: string): Promise<{
    cwQueryUser: (address: string) => Promise<import("../codegen/StarboundOsmosis.types").QueryUserResponse>;
    cwQueryPoolsAndUsers: () => Promise<import("../codegen/StarboundOsmosis.types").QueryPoolsAndUsersResponse>;
    cwQueryLedger: () => Promise<import("../codegen/StarboundOsmosis.types").QueryLedgerResponse>;
    cwQueryConfig: () => Promise<import("../codegen/StarboundOsmosis.types").QueryConfigResponse>;
} | undefined>;
export { getCwExecHelpers, getCwQueryHelpers };
