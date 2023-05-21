import { l } from "../../../common/utils";
import { initWalletList, getSigner } from "./signer";
import { type User } from "../../../common/codegen/StarboundOsmosis.types";
import {
  type ChainRegistryStorage,
  type ChainResponse,
} from "../../../common/interfaces";
import {
  CONTRACT_ADDRESS,
  RPC,
} from "../../../common/config/osmosis-testnet-config.json";
import {
  getCwExecHelpers,
  getCwQueryHelpers,
} from "../../../common/account/cw-helpers";

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

  const { signer, owner, rpc } = await getSigner(RPC, chainId, wallet);

  // user cosmwasm helpers
  const userCwExecHelpers = await getCwExecHelpers(
    CONTRACT_ADDRESS,
    rpc,
    owner,
    signer
  );
  if (!userCwExecHelpers) return;

  const userCwQueryHelpers = await getCwQueryHelpers(CONTRACT_ADDRESS, rpc);
  if (!userCwQueryHelpers) return;

  const { cwDeposit: _cwDeposit, cwWithdraw: _cwWithdraw } = userCwExecHelpers;
  const {
    cwQueryPoolsAndUsers: _cwQueryPoolsAndUsers,
    cwQueryUser: _cwQueryUser,
  } = userCwQueryHelpers;

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
    owner,

    cwDeposit,
    cwWithdraw,
    cwQueryPoolsAndUsers,
    cwQueryUser,
  };
}

export { init };
