import { l } from "../utils";
import { getCwHelpers } from "../helpers/cw-helpers";
import { getSgHelpers } from "../helpers/sg-helpers";
import { initWallet } from "../signers";
import { type User } from "../codegen/Starbound.types";
import type { ClientStruct } from "../helpers/interfaces";
import { CONTRACT_ADDRESS, RPC } from "../config/testnet-config.json";

async function init() {
  const wallet = await initWallet();

  const userClientStruct: ClientStruct = {
    isKeplrType: true,
    RPC,
    wallet,
    chainId: "osmo-test-4",
  };

  // user cosmwasm helpers
  const {
    cwDeposit: _cwDeposit,
    cwWithdraw: _cwWithdraw,
    cwQueryPoolsAndUsers: _cwQueryPoolsAndUsers,
    cwDebugQueryBank: _cwDebugQueryBank,
    cwDebugQueryPoolsAndUsers: _cwDebugQueryPoolsAndUsers,
    cwQueryAssets: _cwQueryAssets,
    owner,
  } = await getCwHelpers(userClientStruct, CONTRACT_ADDRESS);

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

  async function cwDebugQueryBank() {
    try {
      const tx = await _cwDebugQueryBank();
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

  async function cwDebugQueryPoolsAndUsers() {
    try {
      return await _cwDebugQueryPoolsAndUsers();
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwQueryAssets(address: string) {
    try {
      return await _cwQueryAssets(address);
    } catch (error) {
      l(error, "\n");
    }
  }

  return {
    cwDeposit,
    cwWithdraw,
    cwDebugQueryBank,
    cwQueryPoolsAndUsers,
    cwDebugQueryPoolsAndUsers,
    cwQueryAssets,
    owner,
  };
}

export { init };
