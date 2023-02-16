import { type User } from "../codegen/Starbound.types";
import { type ChainRegistryStorage } from "../helpers/interfaces";
declare function init(chains: ChainRegistryStorage, chainType: "main" | "test"): Promise<{
    cwDeposit: (userAlice: User) => Promise<import("@cosmjs/stargate").DeliverTxResponse | undefined>;
    cwWithdraw: (amount: number) => Promise<import("@cosmjs/stargate").DeliverTxResponse | undefined>;
    cwQueryPoolsAndUsers: () => Promise<import("../codegen/Starbound.types").QueryPoolsAndUsersResponse | undefined>;
    cwQueryUser: (address: string) => Promise<import("../codegen/Starbound.types").QueryUserResponse | undefined>;
    owner: string;
} | undefined>;
export { init };
