import { l } from "../utils";
import { fromBech32, toBech32 } from "@cosmjs/encoding";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { NetworkData } from "../interfaces";
import {
  SigningCosmWasmClient,
  CosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";
import {
  OfflineDirectSigner,
  EncodeObject,
  OfflineSigner,
} from "@cosmjs/proto-signing";
import {
  SigningStargateClient,
  StargateClient,
  calculateFee as _calculateFee,
  GasPrice,
  DeliverTxResponse,
  coin,
  StdFee,
} from "@cosmjs/stargate";

// TODO: replace
const fee: StdFee = {
  amount: [coin(0, "uosmo")],
  gas: `${700_000}`,
};

async function getSgClient(
  rpc: string,
  owner?: string,
  signer?: (OfflineSigner & OfflineDirectSigner) | DirectSecp256k1HdWallet
): Promise<
  | {
      client: SigningStargateClient;
      owner: string;
    }
  | {
      client: StargateClient;
    }
  | undefined
> {
  try {
    if (owner && signer) {
      const signingClient = await SigningStargateClient.connectWithSigner(
        rpc,
        signer
      );
      return { client: signingClient, owner };
    }

    const client = await StargateClient.connect(rpc);
    return { client };
  } catch (error) {
    l(error);
  }
}

async function getCwClient(
  rpc: string,
  owner?: string,
  signer?: (OfflineSigner & OfflineDirectSigner) | DirectSecp256k1HdWallet
): Promise<
  | {
      client: SigningCosmWasmClient;
      owner: string;
    }
  | {
      client: CosmWasmClient;
    }
  | undefined
> {
  try {
    if (owner && signer) {
      const signingClient = await SigningCosmWasmClient.connectWithSigner(
        rpc,
        signer
      );
      return { client: signingClient, owner };
    }

    const client = await CosmWasmClient.connect(rpc);
    return { client };
  } catch (error) {
    l(error);
  }
}

function getAddrByPrefix(address: string, prefix: string): string {
  return toBech32(prefix, fromBech32(address).data);
}

function signAndBroadcastWrapper(
  client: SigningStargateClient | SigningCosmWasmClient,
  signerAddress: string,
  margin: number = 1.2
) {
  return async (
    messages: readonly EncodeObject[],
    gasPrice: string | GasPrice,
    memo?: string
  ): Promise<DeliverTxResponse> => {
    const gasSimulated = await client.simulate(signerAddress, messages, memo);
    const gasWanted = Math.ceil(margin * gasSimulated);
    const fee = _calculateFee(gasWanted, gasPrice);
    return await client.signAndBroadcast(signerAddress, messages, fee, memo);
  };
}

function getGasPriceFromChainRegistryItem(
  chain: NetworkData,
  chainType: "main" | "test"
): string {
  const response = chainType === "main" ? chain.main : chain.test;

  const gasPriceAmountDefault = 0.005;
  let gasPriceAmount = 0;

  const minGasPrice = response?.fees.fee_tokens?.[0]?.fixed_min_gas_price;
  if (minGasPrice) gasPriceAmount = minGasPrice;

  gasPriceAmount = Math.max(gasPriceAmountDefault, gasPriceAmount);
  const gasPrice = `${gasPriceAmount}${chain.denomNative}`;

  return gasPrice;
}

export {
  getSgClient,
  getCwClient,
  getAddrByPrefix,
  signAndBroadcastWrapper,
  getGasPriceFromChainRegistryItem,
  fee,
};
