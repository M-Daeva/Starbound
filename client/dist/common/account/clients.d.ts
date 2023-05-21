import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { NetworkData } from "../interfaces";
import { SigningCosmWasmClient, CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { OfflineDirectSigner, EncodeObject, OfflineSigner } from "@cosmjs/proto-signing";
import { SigningStargateClient, StargateClient, GasPrice, DeliverTxResponse, StdFee } from "@cosmjs/stargate";
declare const fee: StdFee;
declare function getSgClient(rpc: string, owner?: string, signer?: (OfflineSigner & OfflineDirectSigner) | DirectSecp256k1HdWallet): Promise<{
    client: SigningStargateClient;
    owner: string;
} | {
    client: StargateClient;
} | undefined>;
declare function getCwClient(rpc: string, owner?: string, signer?: (OfflineSigner & OfflineDirectSigner) | DirectSecp256k1HdWallet): Promise<{
    client: SigningCosmWasmClient;
    owner: string;
} | {
    client: CosmWasmClient;
} | undefined>;
declare function getAddrByPrefix(address: string, prefix: string): string;
declare function signAndBroadcastWrapper(client: SigningStargateClient | SigningCosmWasmClient, signerAddress: string, margin?: number): (messages: readonly EncodeObject[], gasPrice: string | GasPrice, memo?: string) => Promise<DeliverTxResponse>;
declare function getGasPriceFromChainRegistryItem(chain: NetworkData, chainType: "main" | "test"): string;
export { getSgClient, getCwClient, getAddrByPrefix, signAndBroadcastWrapper, getGasPriceFromChainRegistryItem, fee, };
