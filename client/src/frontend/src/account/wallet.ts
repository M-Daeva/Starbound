import { init as _init } from "./testnet-frontend-workers";
import type { User } from "../../../common/codegen/StarboundOsmosis.types";
import { getAddrByChainPrefix, initWalletList } from "./signer";
import { get } from "svelte/store";
import { displayModal } from "../services/helpers";
import type { ChainRegistryStorage } from "../../../common/interfaces";
import {
  addressStorage,
  chainRegistryStorage,
  CHAIN_TYPE,
  userContractStorage,
  ls,
} from "../services/storage";

export async function initCwHandler() {
  let address: string;

  try {
    if (!get(chainRegistryStorage).length) {
      const defaultWallet = await initWalletList([], "main");
      address = (await defaultWallet.getKey("osmosis-1")).bech32Address;
    } else {
      address = await getAddrByChainPrefix(
        get(chainRegistryStorage),
        CHAIN_TYPE,
        "osmo"
      );
    }

    addressStorage.set(address);
    ls.set(address);
    // window.location.reload();
  } catch (error) {
    displayModal(error);
  }
}
async function init(chains: ChainRegistryStorage, chainType: "main" | "test") {
  async function deposit(user: User) {
    const { cwDeposit } = await _init(chains, chainType);
    return await cwDeposit(user);
  }

  async function withdraw(amount: number) {
    const { cwWithdraw } = await _init(chains, chainType);
    return await cwWithdraw(amount);
  }

  async function queryUser(address: string) {
    const { cwQueryUser } = await _init(chains, chainType);
    return await cwQueryUser(address);
  }

  // init wallet, add osmo chain, save address to localSorage
  async function initCwHandler() {
    let address: string;

    try {
      if (!get(chainRegistryStorage).length) {
        const defaultWallet = await initWalletList([], "main");
        address = (await defaultWallet.getKey("osmosis-1")).bech32Address;
      } else {
        address = await getAddrByChainPrefix(
          get(chainRegistryStorage),
          CHAIN_TYPE,
          "osmo"
        );
      }

      addressStorage.set(address);
      ls.set(address);
      window.location.reload();
    } catch (error) {
      displayModal(error);
    }
  }

  async function setUserContractStorage() {
    const address = get(addressStorage);
    if (!address) return "";
    const { user } = await queryUser(address);
    userContractStorage.set(user);
  }

  return {
    deposit,
    withdraw,
    queryUser,
    initCwHandler,
    setUserContractStorage,
  };
}

export { init };
