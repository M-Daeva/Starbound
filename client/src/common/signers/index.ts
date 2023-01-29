import { fromBech32, toBech32 } from "@cosmjs/encoding";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { Keplr, Window as KeplrWindow, ChainInfo } from "@keplr-wallet/types";
import { l } from "../utils";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { OfflineSigner } from "@cosmjs/launchpad";
import { OfflineDirectSigner } from "@cosmjs/proto-signing";
import {
  ClientStruct,
  NetworkData,
  ChainResponse,
} from "../helpers/interfaces";
import {
  SigningStargateClient,
  coin,
  StdFee,
  calculateFee,
} from "@cosmjs/stargate";

const fee: StdFee = {
  amount: [coin(0, "uosmo")],
  gas: `${700_000}`,
};

declare global {
  interface Window extends KeplrWindow {}
}

function _detectWallet() {
  const { keplr } = window;
  if (!keplr) throw new Error("You need to install Keplr");
  return keplr;
}

function _getChainInfo(
  asset: NetworkData | undefined,
  chainType: "main" | "test"
) {
  if (!asset) throw new Error("Chain registry info is not provided!");

  let network: ChainResponse | undefined;

  if (chainType === "main" && asset.main) {
    network = asset.main;
  }
  if (chainType === "test" && asset.test) {
    network = asset.test;
  }
  if (!network) throw new Error("Chain info is not found!");

  // fix for juno testnet and mainnet denoms
  if (network.chain_id.includes("uni-")) {
    asset.denomNative = "ujunox";
  }

  let chainInfo: ChainInfo = {
    chainId: network.chain_id,
    chainName: network.chain_name,
    rpc: network.apis.rpc[0].address,
    rest: network.apis.rest[0].address,
    stakeCurrency: {
      coinDenom: asset.symbol,
      coinMinimalDenom: asset.denomNative,
      coinDecimals: asset.exponent,
      coinGeckoId: asset.coinGeckoId,
    },
    bip44: { coinType: 118 },
    bech32Config: {
      bech32PrefixAccAddr: `${network.bech32_prefix}`,
      bech32PrefixAccPub: `${network.bech32_prefix}pub`,
      bech32PrefixValAddr: `${network.bech32_prefix}valoper`,
      bech32PrefixValPub: `${network.bech32_prefix}valoperpub`,
      bech32PrefixConsAddr: `${network.bech32_prefix}valcons`,
      bech32PrefixConsPub: `${network.bech32_prefix}valconspub`,
    },
    currencies: [
      {
        coinDenom: asset.symbol,
        coinMinimalDenom: asset.denomNative,
        coinDecimals: asset.exponent,
        coinGeckoId: asset.coinGeckoId,
      },
    ],
    feeCurrencies: [
      {
        coinDenom: asset.symbol,
        coinMinimalDenom: asset.denomNative,
        coinDecimals: asset.exponent,
        coinGeckoId: asset.coinGeckoId,
      },
    ],
  };

  return chainInfo;
}

async function _addChainList(
  wallet: Keplr,
  chainRegistry: NetworkData[],
  chainType: "main" | "test"
) {
  for (let asset of chainRegistry) {
    try {
      const chainInfo = _getChainInfo(asset, chainType);
      await wallet.experimentalSuggestChain(chainInfo);
    } catch (error) {
      l(error);
    }
  }
}

async function _unlockWalletList(
  wallet: Keplr,
  chainRegistry: NetworkData[],
  chainType: "main" | "test"
): Promise<void> {
  let promises: Promise<void>[] = [];

  for (let asset of chainRegistry) {
    try {
      const chainInfo = _getChainInfo(asset, chainType);
      promises.push(wallet.enable(chainInfo.chainId));
    } catch (error) {
      l(error);
    }
  }

  await Promise.all(promises);
}

async function initWalletList(
  chainRegistry: NetworkData[] | undefined,
  chainType: "main" | "test"
) {
  const wallet = _detectWallet();
  if (!chainRegistry || !wallet) return;
  await _addChainList(wallet, chainRegistry, chainType); // add network to Keplr
  await _unlockWalletList(wallet, chainRegistry, chainType); // give permission for the webpage to access Keplr
  return wallet;
}

async function _getSigner(clientStruct: ClientStruct) {
  let owner: string;
  let signer:
    | (OfflineSigner & OfflineDirectSigner)
    | undefined
    | DirectSecp256k1HdWallet;

  if ("wallet" in clientStruct) {
    const { chainId, wallet } = clientStruct;
    signer = window.getOfflineSigner?.(chainId);
    owner = (await wallet.getKey(chainId)).bech32Address;
  } else if ("seed" in clientStruct) {
    const { seed, prefix } = clientStruct;
    signer = await DirectSecp256k1HdWallet.fromMnemonic(seed, { prefix });
    owner = (await signer.getAccounts())[0].address;
  } else throw new Error("Wrong arguments!");

  return { signer, owner, RPC: clientStruct.RPC };
}

async function getSgClient(clientStruct: ClientStruct): Promise<{
  client: SigningStargateClient;
  owner: string;
}> {
  const { signer, owner, RPC } = await _getSigner(clientStruct);
  if (!signer) throw new Error("Signer is undefined!");
  const client = await SigningStargateClient.connectWithSigner(RPC, signer);
  return { client, owner };
}

async function getCwClient(clientStruct: ClientStruct): Promise<{
  client: SigningCosmWasmClient;
  owner: string;
}> {
  const { signer, owner, RPC } = await _getSigner(clientStruct);
  if (!signer) throw new Error("Signer is undefined!");
  const client = await SigningCosmWasmClient.connectWithSigner(RPC, signer);
  return { client, owner };
}

function getAddrByPrefix(address: string, prefix: string): string {
  return toBech32(prefix, fromBech32(address).data);
}

async function getAddrByChainPrefix(
  chainRegistry: NetworkData[],
  chainType: "main" | "test",
  prefix: string
) {
  let wallet = _detectWallet();
  if (!wallet) return;

  const chain = chainRegistry.find((item) => item.prefix === prefix);
  let chainId: string | undefined;
  if (chainType === "main") {
    chainId = chain?.main?.chain_id;
  } else {
    chainId = chain?.test?.chain_id;
  }
  if (!chain || !chainId) return;

  await _unlockWalletList(wallet, [chain], chainType); // give permission for the webpage to access Keplr
  return (await wallet.getKey(chainId)).bech32Address;
}

export {
  getSgClient,
  getCwClient,
  getAddrByPrefix,
  initWalletList,
  getAddrByChainPrefix,
  fee,
  calculateFee,
};
