import { l, SEP } from "../utils";
import { getCwHelpers } from "../helpers/cw-helpers";
import { getSgHelpers } from "../helpers/sg-helpers";
import { IbcStruct, SwapStruct, ClientStruct } from "../helpers/structs";
import {
  CONTRACT_ADDRESS,
  PREFIX,
  RPC,
  SEED_ALICE,
  SEED_BOB,
  SEED_DAPP,
} from "../config/ibc-network-config.json";

const clientStruct: ClientStruct = { prefix: PREFIX, RPC, seed: SEED_ALICE };

const fromOsmotoWasmWbaTestnet: IbcStruct = {
  dstPrefix: "wasm",
  sourceChannel: "channel-0",
  sourcePort: "transfer",
  amount: 123,
};

const fromOsmoToAtom: SwapStruct = {
  from: "OSMO",
  to: "ATOM",
  amount: 1_000,
};

async function init() {
  const {
    _sgDelegateFrom,
    _sgGetTokenBalances,
    _sgGrantStakeAuth,
    _sgSwap,
    _sgTransfer,
  } = await getSgHelpers(clientStruct);
  const { _cwDeposit, _cwGetBankBalance, _cwSwap, _cwTransfer } =
    await getCwHelpers(clientStruct, CONTRACT_ADDRESS);

  async function sgTransfer() {
    l(SEP, "sending ibc transfer...");
    try {
      const tx = await _sgTransfer(fromOsmotoWasmWbaTestnet);
      l(tx, "\n");
    } catch (error) {
      l(error, "\n");
    }
  }

  async function sgSwap() {
    l(SEP, "executing swap...");
    try {
      const tx = await _sgSwap(fromOsmoToAtom);
      l(tx, "\n");
    } catch (error) {
      l(error, "\n");
    }
  }

  async function _queryBalance() {
    let balances = await _sgGetTokenBalances(CONTRACT_ADDRESS);
    l({ contract: balances });
  }

  async function cwDeposit() {
    l(SEP, "depositing...");
    try {
      await _cwDeposit(10_000);
      await _queryBalance();
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwTransfer() {
    l(SEP, "sending ibc transfer...");
    try {
      await _cwTransfer(1_000);
      await _queryBalance();
    } catch (error) {
      l(error, "\n");
    }
  }

  const swapStruct: SwapStruct = {
    from: "OSMO",
    to: "ATOM",
    amount: 1_000,
  };

  async function cwSwap() {
    l(SEP, "executing swap...");
    try {
      await _cwSwap(swapStruct);
      await _queryBalance();
    } catch (error) {
      l(error, "\n");
    }
  }

  return { sgTransfer, sgSwap, _queryBalance, cwDeposit, cwTransfer, cwSwap };
}

export { init };
