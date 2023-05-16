import { l } from "../utils";
import { getCwHelpers } from "../helpers/cw-helpers";
import { getSgHelpers } from "../helpers/sg-helpers";
import { initWalletList } from "../signers";
import { type User } from "../codegen/StarboundOsmosis.types";
import {
  type ClientStructWithKeplr,
  type ChainRegistryStorage,
  type ChainResponse,
  type NetworkData,
} from "../helpers/interfaces";
import { CONTRACT_ADDRESS, RPC } from "../config/testnet-config.json";
import { initStorage } from "../../backend/storages";

async function init(chains: ChainRegistryStorage, chainType: "main" | "test") {
  let response: ChainResponse | undefined;
  let chainId: string | undefined;
  const chain = chains?.find((item) => item.denomNative === "uosmo");
  if (!chain) return;

  if (chainType === "main" && chain.main) {
    response = chain.main;
    chainId = response.chain_id;
  }
  if (chainType === "test" && chain.test) {
    response = chain.test;
    chainId = response.chain_id;
  }
  if (!response || !chainId) return;

  const wallet = await initWalletList([chain], chainType);
  if (!wallet) return;

  const userClientStruct: ClientStructWithKeplr = {
    RPC,
    wallet,
    chainId,
  };

  // user cosmwasm helpers
  const userCwHelpers = await getCwHelpers(userClientStruct, CONTRACT_ADDRESS);
  if (!userCwHelpers) return;

  const {
    cwDeposit: _cwDeposit,
    cwWithdraw: _cwWithdraw,
    cwQueryPoolsAndUsers: _cwQueryPoolsAndUsers,
    cwQueryUser: _cwQueryUser,
    owner,
  } = userCwHelpers;

  async function cwDeposit(userAlice: User) {
    try {
      const tx = await _cwDeposit(userAlice);
      return tx;
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwWithdraw(amount: number) {
    try {
      const tx = await _cwWithdraw(amount);
      return tx;
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwQueryPoolsAndUsers() {
    try {
      return await _cwQueryPoolsAndUsers();
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwQueryUser(address: string) {
    try {
      return await _cwQueryUser(address);
    } catch (error) {
      l(error, "\n");
    }
  }

  return {
    cwDeposit,
    cwWithdraw,
    cwQueryPoolsAndUsers,
    cwQueryUser,
    owner,
  };
}

export { init };
