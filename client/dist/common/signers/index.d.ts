import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { Keplr, Window as KeplrWindow } from "@keplr-wallet/types";
import { EncodeObject } from "@cosmjs/proto-signing";
import { ClientStruct, NetworkData } from "../helpers/interfaces";
import { SigningStargateClient, StdFee, GasPrice, DeliverTxResponse } from "@cosmjs/stargate";
declare const fee: StdFee;
declare global {
    interface Window extends KeplrWindow {
    }
}
declare function initWalletList(chainRegistry: NetworkData[] | undefined, chainType: "main" | "test"): Promise<Keplr | undefined>;
declare function getSgClient(clientStruct: ClientStruct): Promise<{
    client: SigningStargateClient;
    owner: string;
}>;
declare function getCwClient(clientStruct: ClientStruct): Promise<{
    client: SigningCosmWasmClient;
    owner: string;
}>;
declare function getAddrByPrefix(address: string, prefix: string): string;
declare function getAddrByChainPrefix(chainRegistry: NetworkData[], chainType: "main" | "test", prefix: string): Promise<string | undefined>;
declare function signAndBroadcastWrapper(client: SigningStargateClient | SigningCosmWasmClient, signerAddress: string, margin?: number): (messages: readonly EncodeObject[], gasPrice: string | GasPrice, memo?: string) => Promise<DeliverTxResponse>;
declare function getGasPriceFromChainRegistryItem(chain: NetworkData, chainType: "main" | "test"): string;
export { getSgClient, getCwClient, getAddrByPrefix, initWalletList, getAddrByChainPrefix, fee, signAndBroadcastWrapper, getGasPriceFromChainRegistryItem, };
