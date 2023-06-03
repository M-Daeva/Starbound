import {
  chainRegistryStorage,
  CHAIN_TYPE,
  currenChain,
} from "../../services/storage";

import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { addChainList, addInitAddress, getWallet } from "./getWallet";
import { get } from "svelte/store";

export const connectWallet = async (walletName: string) => {
  const wallet = getWallet(walletName);
  const chainRegistry = get(chainRegistryStorage);
  if (!!chainRegistry.length) {
    try {
      const defaultChain = chainRegistry.find(
        (chain) => chain.prefix === "osmo"
      );
      await addChainList(wallet, [defaultChain], CHAIN_TYPE);
    } catch (e) {
      Error(e);
    }
  }
  const currentChain = get(currenChain);
  const chainId = currentChain?.chainId || "osmosis-1";
  await addInitAddress(wallet, chainId);
  if (currentChain?.chainId) {
    const offlineSigner = wallet.getOfflineSigner(chainId);
    const cosmJS = await SigningCosmWasmClient.connectWithSigner(
      currentChain.rpc,
      offlineSigner
    );
  }
};
