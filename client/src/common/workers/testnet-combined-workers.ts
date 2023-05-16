import { l, SEP } from "../utils";
import { mockUpdatePoolsAndUsers as _mockUpdatePoolsAndUsers } from "../helpers/api-helpers";
import { getCwHelpers } from "../helpers/cw-helpers";
import { DENOMS } from "../helpers/assets";
import { getSgHelpers } from "../helpers/sg-helpers";
import {
  User,
  Asset,
  QueryPoolsAndUsersResponse,
  PoolExtracted,
  UserExtracted,
} from "../codegen/StarboundOsmosis.types";
import {
  DelegationStruct,
  ClientStructWithoutKeplr,
  IbcStruct,
} from "../helpers/interfaces";
import {
  CONTRACT_ADDRESS,
  PREFIX,
  RPC,
  SEED_ALICE,
  SEED_BOB,
  SEED_DAPP,
} from "../config/testnet-config.json";

const aliceClientStruct: ClientStructWithoutKeplr = {
  prefix: PREFIX,
  RPC,
  seed: SEED_ALICE,
};
const bobClientStruct: ClientStructWithoutKeplr = {
  prefix: PREFIX,
  RPC,
  seed: SEED_BOB,
};
const dappClientStruct: ClientStructWithoutKeplr = {
  prefix: PREFIX,
  RPC,
  seed: SEED_DAPP,
};

async function init() {
  // alice cosmwasm helpers
  const aliceCwHelpers = await getCwHelpers(
    aliceClientStruct,
    CONTRACT_ADDRESS
  );
  if (!aliceCwHelpers) return;

  const {
    owner: aliceAddr,
    cwDeposit: _cwDepositAlice,
    cwWithdraw: _cwWithdrawAlice,
  } = aliceCwHelpers;

  // bob cosmwasm helpers
  const bobCwHelpers = await getCwHelpers(bobClientStruct, CONTRACT_ADDRESS);
  if (!bobCwHelpers) return;

  const { owner: bobAddr, cwDeposit: _cwDepositBob } = bobCwHelpers;

  // dapp cosmwasm helpers
  const dappCwHelpers = await getCwHelpers(dappClientStruct, CONTRACT_ADDRESS);
  if (!dappCwHelpers) return;

  const {
    owner: dappAddr,
    cwSwap: _cwSwap,
    cwQueryPoolsAndUsers: _cwQueryPoolsAndUsers,
    cwUpdatePoolsAndUsers: _cwUpdatePoolsAndUsers,
    cwQueryUser: _cwQueryUser,
    cwTransfer: _cwTransfer,
  } = dappCwHelpers;

  // alice stargate helpers
  const aliceSgHelpers = await getSgHelpers(aliceClientStruct);
  if (!aliceSgHelpers) return;

  const { sgGrantStakeAuth: _sgGrantStakeAuth, sgTransfer: _sgTransfer } =
    aliceSgHelpers;

  // dapp stargate helpers
  const dappSgHelpers = await getSgHelpers(dappClientStruct);
  if (!dappSgHelpers) return;

  const {
    sgDelegateFrom: _sgDelegateFrom,
    sgGetTokenBalances: _sgGetTokenBalances,
    sgUpdatePoolList: _sgUpdatePoolList,
  } = dappSgHelpers;

  async function sgUpdatePoolList() {
    let pools = await _sgUpdatePoolList();
    l({ pools });
  }

  async function queryBalance() {
    let balances = await _sgGetTokenBalances(CONTRACT_ADDRESS);
    l({ contract: balances });
  }

  const grantStakeStruct: DelegationStruct = {
    targetAddr: dappAddr,
    tokenAmount: 5_000,
    tokenDenom: DENOMS.OSMO,
    validatorAddr: "osmovaloper1c584m4lq25h83yp6ag8hh4htjr92d954kphp96",
  };

  async function sgGrantStakeAuth() {
    l(SEP, "granting staking permission...");
    try {
      const tx = await _sgGrantStakeAuth(grantStakeStruct);
      l(tx, "\n");
    } catch (error) {
      l(error, "\n");
    }
  }

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

  const stakeFromStruct: DelegationStruct = {
    targetAddr: aliceAddr,
    tokenAmount: 1_000,
    tokenDenom: DENOMS.OSMO,
    validatorAddr: "osmovaloper1c584m4lq25h83yp6ag8hh4htjr92d954kphp96",
  };

  async function sgDelegateFrom() {
    l(SEP, "delegating from...");
    try {
      const tx = await _sgDelegateFrom(stakeFromStruct);
      l(tx, "\n");
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwQueryPoolsAndUsers() {
    l(SEP, "querying pools and users...");
    try {
      return await _cwQueryPoolsAndUsers();
    } catch (error) {
      l(error, "\n");
      let empty: QueryPoolsAndUsersResponse = { pools: [], users: [] };
      return empty;
    }
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
    deposited: `${100}`,
    is_controlled_rebalancing: false,
  };

  async function cwDepositAlice() {
    l(SEP, "alice depositing...");
    try {
      await _cwDepositAlice(userAlice);
      // await _queryBalance();
    } catch (error) {
      l(error, "\n");
    }
  }

  let assetListBob: Asset[] = [
    // ATOM
    {
      asset_denom: DENOMS.ATOM,
      wallet_address: "cosmos1chgwz55h9kepjq0fkj5supl2ta3nwu63327q35",
      wallet_balance: "10000000",
      weight: "0.3",
      amount_to_send_until_next_epoch: "0",
    },
    // JUNO
    {
      asset_denom: DENOMS.JUNO,
      wallet_address: "juno1chgwz55h9kepjq0fkj5supl2ta3nwu638camkg",
      wallet_balance: "10000000",
      weight: "0.7",
      amount_to_send_until_next_epoch: "0",
    },
  ];

  let userBob: User = {
    asset_list: assetListBob,
    day_counter: "3",
    deposited: `${600_000}`,
    is_controlled_rebalancing: false,
  };

  async function cwDepositBob() {
    l(SEP, "bob depositing...");
    try {
      await _cwDepositBob(userBob);
      // await _queryBalance();
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwWithdrawAlice() {
    l(SEP, "alice withdrawing...");
    try {
      await _cwWithdrawAlice(100_000);
      // await _queryBalance();
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwMockUpdatePoolsAndUsers() {
    l(SEP, "updating pools and users...");
    try {
      let data: { pools: PoolExtracted[]; users: UserExtracted[] } = {
        pools: [
          {
            id: "1",
            denom:
              "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2",
            price: "11.5",
            symbol: "uatom",
            channel_id: "channel-1110",
            port_id: "transfer",
          },
          {
            id: "497",
            denom:
              "ibc/46B44899322F3CD854D2D46DEEF881958467CDD4B3B10086DA49296BBED94BED",
            price: "3.5",
            symbol: "ujuno",
            channel_id: "channel-1110",
            port_id: "transfer",
          },
          {
            id: "481",
            denom:
              "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F",
            price: "1",
            symbol: "debug_ueeur",
            channel_id: "debug_ch_id",
            port_id: "transfer",
          },
        ],
        users: [
          {
            osmo_address: "osmo1gjqnuhv52pd2a7ets2vhw9w9qa9knyhy7y9tgx",
            asset_list: [
              {
                asset_denom: DENOMS.ATOM,
                wallet_address: "cosmos1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyklkm75",
                wallet_balance: "1",
              },
              {
                asset_denom: DENOMS.JUNO,
                wallet_address: "juno1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyqd4qeg",
                wallet_balance: "2",
              },
            ],
          },
          {
            osmo_address: "osmo1chgwz55h9kepjq0fkj5supl2ta3nwu63e3ds8x",
            asset_list: [
              {
                asset_denom: DENOMS.ATOM,
                wallet_address: "cosmos1chgwz55h9kepjq0fkj5supl2ta3nwu63327q35",
                wallet_balance: "10000001",
              },

              {
                asset_denom: DENOMS.JUNO,
                wallet_address: "juno1chgwz55h9kepjq0fkj5supl2ta3nwu638camkg",
                wallet_balance: "10000002",
              },
            ],
          },
        ],
      };

      await _cwUpdatePoolsAndUsers(data.pools, data.users, "0uosmo");
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwQueryUser() {
    let aliceAddr = "osmo1gjqnuhv52pd2a7ets2vhw9w9qa9knyhy7y9tgx";
    let bobAddr = "osmo1chgwz55h9kepjq0fkj5supl2ta3nwu63e3ds8x";
    let addresses = [aliceAddr, bobAddr];

    for (let addr of addresses) {
      l(SEP, "query assets...");
      try {
        await _cwQueryUser(addr);
      } catch (error) {
        l(error, "\n");
      }
    }
  }

  async function cwSwap() {
    l(SEP, "swapping...");
    try {
      await _cwSwap("0uosmo");
      // await _queryBalance();
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwTransfer() {
    l(SEP, "transfering...");
    try {
      await _cwTransfer("0uosmo");
      // await _queryBalance();
    } catch (error) {
      l(error, "\n");
    }
  }

  const ibcStruct: IbcStruct = {
    amount: 1_000,
    dstPrefix: "juno",
    sourceChannel: "channel-1110",
    sourcePort: "transfer",
  };

  async function sgTransfer() {
    try {
      let tx = await _sgTransfer(ibcStruct);
      l(tx);
    } catch (error) {
      l(error, "\n");
    }
  }

  return {
    queryBalance,
    sgGrantStakeAuth,
    cwSwap,
    sgDelegateFrom,
    sgUpdatePoolList,
    cwQueryPoolsAndUsers,
    cwDepositAlice,
    cwDepositBob,
    cwWithdrawAlice,
    cwMockUpdatePoolsAndUsers,
    cwQueryUser,
    cwTransfer,
    sgTransfer,
  };
}

export { init };
