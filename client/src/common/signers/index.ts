import { fromBech32, toBech32 } from "@cosmjs/encoding";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { SigningStargateClient, coin, StdFee } from "@cosmjs/stargate";
import { Keplr, Window as KeplrWindow, ChainInfo } from "@keplr-wallet/types";
import { l } from "../utils";
import { CHAIN_ID } from "../config/testnet-config.json";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { OfflineSigner } from "@cosmjs/launchpad";
import { OfflineDirectSigner } from "@cosmjs/proto-signing";
import {
  ClientStruct,
  type ClientStructWithKeplr,
  type ClientStructWithoutKeplr,
  NetworkData,
  ChainResponse,
} from "../helpers/interfaces";

const CHAIN_ID2 = "uni-5";

const fee: StdFee = {
  amount: [coin(0, "uosmo")],
  gas: "500000",
};

declare global {
  interface Window extends KeplrWindow {}
}

function detectWallet() {
  const { keplr } = window;
  if (!keplr) throw new Error("You need to install Keplr");
  return keplr;
}

function getChainInfo(
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

async function addChainList(
  wallet: Keplr,
  chainRegistry: NetworkData[],
  chainType: "main" | "test"
) {
  for (let asset of chainRegistry) {
    try {
      const chainInfo = getChainInfo(asset, chainType);
      await wallet.experimentalSuggestChain(chainInfo);
    } catch (error) {
      l(error);
    }
  }
}

async function unlockWalletList(
  wallet: Keplr,
  chainRegistry: NetworkData[],
  chainType: "main" | "test"
): Promise<void> {
  let promises: Promise<void>[] = [];

  for (let asset of chainRegistry) {
    try {
      const chainInfo = getChainInfo(asset, chainType);
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
  const wallet = detectWallet();
  if (!chainRegistry || !wallet) return;
  await addChainList(wallet, chainRegistry, chainType); // add network to Keplr
  await unlockWalletList(wallet, chainRegistry, chainType); // give permission for the webpage to access Keplr
  return wallet;
}

async function addChain(wallet: Keplr) {
  let testnetChainInfo = {
    // Chain-id of the Osmosis chain.
    chainId: "osmo-test-4",
    // The name of the chain to be displayed to the user.
    chainName: "osmosistestnet",
    // RPC endpoint of the chain. In this case we are using blockapsis, as it's accepts connections from any host currently. No Cors limitations.
    rpc: "https://osmosistest-rpc.quickapi.com/",
    // REST endpoint of the chain.
    rest: "https://osmosistest-lcd.quickapi.com/",
    // Staking coin information
    stakeCurrency: {
      // Coin denomination to be displayed to the user.
      coinDenom: "OSMO",
      // Actual denom (i.e. uatom, uscrt) used by the blockchain.
      coinMinimalDenom: "uosmo",
      // # of decimal points to convert minimal denomination to user-facing denomination.
      coinDecimals: 6,
      // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
      // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
      // coinGeckoId: ""
    },
    // (Optional) If you have a wallet webpage used to stake the coin then provide the url to the website in `walletUrlForStaking`.
    // The 'stake' button in Keplr extension will link to the webpage.
    // walletUrlForStaking: "",
    // The BIP44 path.
    bip44: {
      // You can only set the coin type of BIP44.
      // 'Purpose' is fixed to 44.
      coinType: 118,
    },
    // Bech32 configuration to show the address to user.
    // This field is the interface of
    // {
    //   bech32PrefixAccAddr: string;
    //   bech32PrefixAccPub: string;
    //   bech32PrefixValAddr: string;
    //   bech32PrefixValPub: string;
    //   bech32PrefixConsAddr: string;
    //   bech32PrefixConsPub: string;
    // }
    bech32Config: {
      bech32PrefixAccAddr: "osmo",
      bech32PrefixAccPub: "osmopub",
      bech32PrefixValAddr: "osmovaloper",
      bech32PrefixValPub: "osmovaloperpub",
      bech32PrefixConsAddr: "osmovalcons",
      bech32PrefixConsPub: "osmovalconspub",
    },
    // List of all coin/tokens used in this chain.
    currencies: [
      {
        // Coin denomination to be displayed to the user.
        coinDenom: "OSMO",
        // Actual denom (i.e. uatom, uscrt) used by the blockchain.
        coinMinimalDenom: "uosmo",
        // # of decimal points to convert minimal denomination to user-facing denomination.
        coinDecimals: 6,
        // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
        // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
        // coinGeckoId: ""
      },
    ],
    // List of coin/tokens used as a fee token in this chain.
    feeCurrencies: [
      {
        // Coin denomination to be displayed to the user.
        coinDenom: "OSMO",
        // Actual denom (i.e. uosmo, uscrt) used by the blockchain.
        coinMinimalDenom: "uosmo",
        // # of decimal points to convert minimal denomination to user-facing denomination.
        coinDecimals: 6,
        // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
        // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
        // coinGeckoId: ""
      },
    ],
    // (Optional) The number of the coin type.
    // This field is only used to fetch the address from ENS.
    // Ideally, it is recommended to be the same with BIP44 path's coin type.
    // However, some early chains may choose to use the Cosmos Hub BIP44 path of '118'.
    // So, this is separated to support such chains.
    coinType: 118,
    // (Optional) This is used to set the fee of the transaction.
    // If this field is not provided, Keplr extension will set the default gas price as (low: 0.01, average: 0.025, high: 0.04).
    // Currently, Keplr doesn't support dynamic calculation of the gas prices based on on-chain data.
    // Make sure that the gas prices are higher than the minimum gas prices accepted by chain validators and RPC/REST endpoint.
    gasPriceStep: {
      low: 0.01,
      average: 0.025,
      high: 0.04,
    },
  };

  let testnetChainInfo2 = {
    chainId: "uni-5",
    chainName: "junotestnet",
    rpc: "https://rpc.uni.junonetwork.io/",
    rest: "https://api.uni.junonetwork.io/",
    stakeCurrency: {
      coinDenom: "JUNO",
      coinMinimalDenom: "ujunox",
      coinDecimals: 6,
    },
    bip44: {
      coinType: 118,
    },
    bech32Config: {
      bech32PrefixAccAddr: "juno",
      bech32PrefixAccPub: "junopub",
      bech32PrefixValAddr: "junovaloper",
      bech32PrefixValPub: "junovaloperpub",
      bech32PrefixConsAddr: "junovalcons",
      bech32PrefixConsPub: "junovalconspub",
    },
    currencies: [
      {
        coinDenom: "JUNO",
        coinMinimalDenom: "ujuno",
        coinDecimals: 6,
      },
    ],
    feeCurrencies: [
      {
        coinDenom: "JUNO",
        coinMinimalDenom: "ujuno",
        coinDecimals: 6,
      },
    ],
    coinType: 118,
    gasPriceStep: {
      low: 0.01,
      average: 0.025,
      high: 0.04,
    },
  };

  await wallet.experimentalSuggestChain(testnetChainInfo);
  await wallet.experimentalSuggestChain(testnetChainInfo2);
}

async function unlockWallet(wallet: Keplr): Promise<void> {
  await wallet.enable(CHAIN_ID);
  await wallet.enable(CHAIN_ID2);
}

/**
 *
 * @param clientStruct - requires RPC, wallet, chainId or RPC, prefix, seed
 * @returns
 */
async function getSigner(clientStruct: ClientStruct) {
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
  const { signer, owner, RPC } = await getSigner(clientStruct);
  if (!signer) throw new Error("Signer is undefined!");
  const client = await SigningStargateClient.connectWithSigner(RPC, signer);
  return { client, owner };
}

async function getCwClient(clientStruct: ClientStruct): Promise<{
  client: SigningCosmWasmClient;
  owner: string;
}> {
  const { signer, owner, RPC } = await getSigner(clientStruct);
  if (!signer) throw new Error("Signer is undefined!");
  const client = await SigningCosmWasmClient.connectWithSigner(RPC, signer);
  return { client, owner };
}

function getAddrByPrefix(address: string, prefix: string): string {
  return toBech32(prefix, fromBech32(address).data);
}

async function initWallet() {
  let wallet = detectWallet();
  if (!wallet) return;
  await addChain(wallet); // add network to Keplr
  await unlockWallet(wallet); // give permission for the webpage to access Keplr
  return wallet;
}

// get address by chain_id using installed by default networks
async function getAddrByChainId(chainId: string = "osmosis-1") {
  let wallet = detectWallet();
  if (!wallet) return;
  await unlockWallet(wallet); // give permission for the webpage to access Keplr
  return (await wallet.getKey(chainId)).bech32Address;
}

export {
  // initWallet,
  getSgClient,
  getCwClient,
  getAddrByPrefix,
  fee,
  initWalletList,
  getAddrByChainId,
};
