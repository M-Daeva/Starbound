import { l, SEP } from "../utils";
import { getCwHelpers } from "../helpers/cw-helpers";
import { getSgHelpers } from "../helpers/sg-helpers";
import { DENOMS } from "../helpers/assets";
import { TransferParams, Asset, User } from "../codegen/Starbound.types";
import { IbcStruct, SwapStruct, ClientStruct } from "../helpers/interfaces";
import {
  CONTRACT_ADDRESS,
  PREFIX,
  RPC,
  SEED_ALICE,
  SEED_BOB,
  SEED_DAPP,
} from "../config/localnet-ibc-config.json";

const aliceClientStruct: ClientStruct = {
  isKeplrType: false,
  prefix: PREFIX,
  RPC,
  seed: SEED_ALICE,
};

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
  // alice cosmwasm helpers
  const { cwDeposit: _cwDeposit, cwMultiTransfer: _cwMultiTransfer } =
    await getCwHelpers(aliceClientStruct, CONTRACT_ADDRESS);

  // alice stargate helpers
  const {
    sgGetTokenBalances: _sgGetTokenBalances,
    sgSwap: _sgSwap,
    sgTransfer: _sgTransfer,
  } = await getSgHelpers(aliceClientStruct);

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

  let assetListAlice: Asset[] = [
    // ATOM
    {
      asset_denom: DENOMS.ATOM,
      wallet_address: "cosmos1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyklkm75",
      wallet_balance: "0",
      weight: "0.5",
      amount_to_send_until_next_epoch: "0",
    },
    // JUNO
    {
      asset_denom: DENOMS.JUNO,
      wallet_address: "juno1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyqd4qeg",
      wallet_balance: "0",
      weight: "0.5",
      amount_to_send_until_next_epoch: "0",
    },
  ];

  let userAlice: User = {
    asset_list: assetListAlice,
    day_counter: "3",
    deposited_on_current_period: `${100}`,
    deposited_on_next_period: "0",
    is_controlled_rebalancing: false,
  };

  async function cwDeposit() {
    l(SEP, "depositing...");
    try {
      await _cwDeposit(userAlice);
      await _queryBalance();
    } catch (error) {
      l(error, "\n");
    }
  }

  // async function cwTransfer() {
  //   l(SEP, "sending ibc transfer...");
  //   try {
  //     await _cwTransfer(1_000);
  //     await _queryBalance();
  //   } catch (error) {
  //     l(error, "\n");
  //   }
  // }

  // const swapStruct: SwapStruct = {
  //   from: "OSMO",
  //   to: "ATOM",
  //   amount: 1_000,
  // };

  // async function cwSwap() {
  //   l(SEP, "executing swap...");
  //   try {
  //     await _cwSwap(swapStruct);
  //     await _queryBalance();
  //   } catch (error) {
  //     l(error, "\n");
  //   }
  // }

  const wasmChannel = "channel-0";
  const wasmAddr = "wasm1chgwz55h9kepjq0fkj5supl2ta3nwu63mk04cl";
  const wasmRevision = "5";
  const wasmHeight = "500000";
  let osmoAmount = "1";

  let tokenParams: TransferParams = {
    channel_id: wasmChannel,
    to: wasmAddr,
    amount: osmoAmount,
    denom: DENOMS.OSMO,
    block_revision: wasmRevision,
    block_height: wasmHeight,
  };

  let tokenParams2: TransferParams = {
    channel_id: wasmChannel,
    to: wasmAddr,
    amount: "2",
    denom: DENOMS.OSMO,
    block_revision: wasmRevision,
    block_height: wasmHeight,
  };

  let params: TransferParams[] = [tokenParams, tokenParams2];

  async function cwMultiTransfer() {
    l("cwMultiTransfer");
    try {
      await _cwMultiTransfer(params);
    } catch (error) {
      l(error, "\n");
    }
  }

  return {
    sgTransfer,
    sgSwap,
    cwDeposit,
    cwMultiTransfer,
  };
}

export { init };
