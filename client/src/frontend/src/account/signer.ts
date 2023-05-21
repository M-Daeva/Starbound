import { l } from "../../../common/utils";
import { Keplr, Window as KeplrWindow, ChainInfo } from "@keplr-wallet/types";
import { NetworkData, ChainResponse } from "../../../common/interfaces";
import { calculateFee as _calculateFee } from "@cosmjs/stargate";

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
      promises.push(wallet.enable(chainInfo.chainId)); // TODO: use enable(chainInfolist)
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

async function getSigner(rpc: string, chainId: string, wallet: Keplr) {
  const signer = window.getOfflineSigner?.(chainId);
  const owner = (await wallet.getKey(chainId)).bech32Address;

  return { signer, owner, rpc };
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

export { getSigner, initWalletList, getAddrByChainPrefix };
