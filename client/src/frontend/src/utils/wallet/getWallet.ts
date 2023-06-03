import { WalletType } from "./interfaces";
import type { Keplr } from "@keplr-wallet/types";
import { ChainResponse, NetworkData } from "../../../../common/interfaces";
import { l } from "../../../../common/utils";
import { ChainInfo } from "@keplr-wallet/types";
import { addressStorage, currenChain } from "../../services/storage";
import { get } from "svelte/store";

const detectKeplr = (): Keplr => {
  if (typeof window.keplr !== "undefined") return window.keplr;
  throw new Error("wallet Keplr is not defined");
};

const detectLeap = (): Keplr => {
  if (typeof window.leap !== "undefined") return window.leap;
  throw new Error("wallet Leap is not defined");
};

export const detectCosmostation = (): Keplr => {
  if (typeof window.cosmostation.providers.keplr !== "undefined")
    return window.cosmostation.providers.keplr;
  throw new Error("wallet cosmostation is not defined");
};

export const getWallet = (type: string) => {
  switch (type) {
    case WalletType.KEPLR:
      return detectKeplr();
    case WalletType.LEAP:
      return detectLeap();
    case WalletType.COSMOSTATION:
      return detectCosmostation();
    default: {
      throw new Error("Unknown wallet type");
    }
  }
};

export const addChainList = async (
  wallet: Keplr,
  chainRegistry: NetworkData[],
  chainType
) => {
  for (let asset of chainRegistry) {
    try {
      const chainInfo = getChainInfo(asset, chainType);
      await wallet.experimentalSuggestChain(chainInfo);
      if (chainInfo.chainId === "osmo-test-5") {
        currenChain.set(chainInfo);
      }
    } catch (e) {
      if (e.name === "SyntaxError") {
        console.log(e.message);
      } else {
        l(e);
      }
    }
  }
};
const getChainInfo = (asset: NetworkData, chainType) => {
  let network: ChainResponse | undefined = asset[chainType];

  if (!network) throw new SyntaxError("Chain info is not found!");

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
};

export const addInitAddress = async (wallet: Keplr, chainId: string) => {
  try {
    await wallet.enable(chainId);
    const address = (await wallet.getKey(chainId)).bech32Address;
    addressStorage.set(address);
  } catch (e) {
    new Error(e);
  }
};
