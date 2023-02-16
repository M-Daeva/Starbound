import { ClientStruct, UpdateConfigStruct } from "./interfaces";
import { User, PoolExtracted, UserExtracted, TransferParams } from "../codegen/Starbound.types";
declare function getCwHelpers(clientStruct: ClientStruct, contractAddress: string): Promise<{
    owner: string;
    cwDeposit: (user: User) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    cwWithdraw: (tokenAmount: number) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    cwUpdateConfig: (updateConfigStruct: UpdateConfigStruct, gasPrice: string) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    cwUpdatePoolsAndUsers: (pools: PoolExtracted[], users: UserExtracted[], gasPrice: string) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    cwSwap: (gasPrice: string) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    cwTransfer: (gasPrice: string) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    cwMultiTransfer: (params: TransferParams[]) => Promise<import("@cosmjs/stargate").DeliverTxResponse>;
    cwQueryUser: (address: string) => Promise<import("../codegen/Starbound.types").QueryUserResponse>;
    cwQueryPoolsAndUsers: () => Promise<import("../codegen/Starbound.types").QueryPoolsAndUsersResponse>;
    cwQueryLedger: () => Promise<import("../codegen/Starbound.types").QueryLedgerResponse>;
    cwQueryConfig: () => Promise<import("../codegen/Starbound.types").QueryConfigResponse>;
}>;
export { getCwHelpers };
