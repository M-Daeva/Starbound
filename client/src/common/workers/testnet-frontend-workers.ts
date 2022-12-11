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
    cwQueryUser: _cwQueryUser,
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
