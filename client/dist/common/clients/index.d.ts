import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { SigningStargateClient, StdFee } from "@cosmjs/stargate";
import { ClientStruct } from "../helpers/interfaces";
import { Keplr, Window as KeplrWindow } from "@keplr-wallet/types";
declare const fee: StdFee;
declare global {
    interface Window extends KeplrWindow {
    }
}
declare function getSgClient(clientStruct: ClientStruct): Promise<{
    client: SigningStargateClient;
    owner: string;
}>;
declare function getCwClient(clientStruct: ClientStruct): Promise<{
    client: SigningCosmWasmClient;
    owner: string;
}>;
declare function getAddrByPrefix(address: string, prefix: string): string;
declare function initWallet(): Promise<Keplr | undefined>;
export { initWallet, getSgClient, getCwClient, getAddrByPrefix, fee };
