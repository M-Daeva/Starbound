import { l } from "../utils";
import { getCwHelpers } from "../helpers/cw-helpers";
import { getSgHelpers } from "../helpers/sg-helpers";
import { initWallet } from "../clients";
import { DelegationStruct, ClientStruct, User } from "../helpers/interfaces";
import { CONTRACT_ADDRESS, RPC } from "../../config/test-network-config.json";

async function init() {
  const wallet = await initWallet();

  const userClientStruct: ClientStruct = {
    RPC,
    wallet,
  };

  const userClientStructJuno: ClientStruct = {
    RPC: "https://rpc.uni.juno.deuslabs.fi",
    wallet,
  };

  // user cosmwasm helpers
  const {
    _cwDepositNew,
    _cwWithdrawNew,
    _cwQueryPoolsAndUsers,
    _cwDebugQueryBank,
    _cwDebugQueryPoolsAndUsers,
    _cwDebugQueryAssets,
    owner,
  } = await getCwHelpers(userClientStruct, CONTRACT_ADDRESS);

  // user stargate helpers
  const { _sgGrantStakeAuth } = await getSgHelpers(userClientStructJuno);

  async function sgGrantStakeAuth(grantStakeStruct: DelegationStruct) {
    try {
      const tx = await _sgGrantStakeAuth(grantStakeStruct);
      l(tx, "\n");
      return tx;
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwDeposit(userAlice: User) {
    try {
      const tx = await _cwDepositNew(userAlice);
      return tx;
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwWithdraw(amount: number) {
    try {
      const tx = await _cwWithdrawNew(amount);
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

  async function cwDebugQueryAssets(address: string) {
    try {
      return await _cwDebugQueryAssets(address);
    } catch (error) {
      l(error, "\n");
    }
  }

  return {
    sgGrantStakeAuth,
    cwDeposit,
    cwWithdraw,
    cwDebugQueryBank,
    cwQueryPoolsAndUsers,
    cwDebugQueryPoolsAndUsers,
    cwDebugQueryAssets,
    owner,
  };
}

export { init };
