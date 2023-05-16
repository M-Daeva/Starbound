import { init as _init } from "../../../common/workers/testnet-frontend-workers";
import type { User } from "../../../common/codegen/StarboundOsmosis.types";
import { getAddrByChainPrefix, initWalletList } from "../../../common/signers";
import { get } from "svelte/store";
import { l } from "../../../common/utils";
import { displayModal } from "./helpers";
import { type ChainRegistryStorage } from "../../../common/helpers/interfaces";
import {
  addressStorage,
  LOCAL_STORAGE_KEY,
  chainRegistryStorage,
  CHAIN_TYPE,
  userContractStorage,
} from "../services/storage";

async function init(chains: ChainRegistryStorage, chainType: "main" | "test") {
  async function deposit(user: User) {
    const { cwDeposit } = await _init(chains, chainType);
    return await cwDeposit(user);
  }

  async function withdraw(amount: number) {
    const { cwWithdraw } = await _init(chains, chainType);
    return await cwWithdraw(amount);
  }

  // TODO: for debugging - remove it later
  async function queryPoolsAndUsers() {
    const { cwQueryPoolsAndUsers } = await _init(chains, chainType);
    return await cwQueryPoolsAndUsers();
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
      localStorage.setItem(LOCAL_STORAGE_KEY, address);
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
    queryPoolsAndUsers,
    queryUser,
    initCwHandler,
    setUserContractStorage,
  };
}

export { init };
