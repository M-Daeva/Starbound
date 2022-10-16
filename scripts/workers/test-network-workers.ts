import { l, SEP } from "../utils";
import { _mockUpdatePoolsAndUsers } from "../helpers/api-helpers";
import { getCwHelpers } from "../helpers/cw-helpers";
import { DENOMS } from "../osmo-pools";
import { getSgHelpers } from "../helpers/sg-helpers";
import {
  SwapStruct,
  DelegationStruct,
  ClientStruct,
  User,
  Asset,
  QueryPoolsAndUsersResponse,
  PoolExtracted,
  UserExtracted,
  IbcStruct,
} from "../helpers/interfaces";
import {
  CONTRACT_ADDRESS,
  PREFIX,
  RPC,
  SEED_ALICE,
  SEED_BOB,
  SEED_DAPP,
} from "../config/test-network-config.json";

const aliceClientStruct: ClientStruct = {
  prefix: PREFIX,
  RPC,
  seed: SEED_ALICE,
};
const bobClientStruct: ClientStruct = {
  prefix: PREFIX,
  RPC,
  seed: SEED_BOB,
};
const dappClientStruct: ClientStruct = { prefix: PREFIX, RPC, seed: SEED_DAPP };

async function init() {
  // alice cosmwasm helpers
  const {
    owner: aliceAddr,
    _cwDeposit,
    _cwDepositNew: _cwDepositAlice,
    _cwWithdrawNew: _cwWithdrawAlice,
  } = await getCwHelpers(aliceClientStruct, CONTRACT_ADDRESS);

  // bob cosmwasm helpers
  const { owner: bobAddr, _cwDepositNew: _cwDepositBob } = await getCwHelpers(
    bobClientStruct,
    CONTRACT_ADDRESS
  );

  // dapp cosmwasm helpers
  const {
    owner: dappAddr,
    _cwSwap,
    _cwGetPools,
    _cwGetPrices,
    _cwQueryPoolsAndUsers,
    _cwDebugQueryPoolsAndUsers,
    _cwUpdatePoolsAndUsers,
    _cwDebugQueryAssets,
    _cwDebugQueryBank,
    _cwTransfer,
  } = await getCwHelpers(dappClientStruct, CONTRACT_ADDRESS);

  // alice stargate helpers
  const { _sgGrantStakeAuth, _sgTransfer } = await getSgHelpers(
    aliceClientStruct
  );

  // dapp stargate helpers
  const { _sgDelegateFrom, _sgGetTokenBalances, _sgUpdatePoolList } =
    await getSgHelpers(dappClientStruct);

  async function sgUpdatePoolList() {
    let pools = await _sgUpdatePoolList();
    l({ pools });
  }

  async function _queryBalance() {
    let balances = await _sgGetTokenBalances(CONTRACT_ADDRESS);
    l({ contract: balances });
  }

  async function cwDeposit() {
    l(SEP, "depositing...");
    try {
      await _cwDeposit(10_000);
      // await _queryBalance();
    } catch (error) {
      l(error, "\n");
    }
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

  async function cwGetPools() {
    l(SEP, "querying pools...");
    try {
      await _cwGetPools();
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwGetPrices() {
    l(SEP, "querying prices...");
    try {
      await _cwGetPrices();
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwDebugQueryPoolsAndUsers() {
    l(SEP, "debug querying pools and users...");
    try {
      await _cwDebugQueryPoolsAndUsers();
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
    deposited_on_current_period: `${1_000_000}`,
    deposited_on_next_period: "0",
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
    deposited_on_current_period: `${600_000}`,
    deposited_on_next_period: "0",
    is_controlled_rebalancing: false, // TODO: try true
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

      await _cwUpdatePoolsAndUsers(data.pools, data.users);
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwDebugQueryAssets() {
    let aliceAddr = "osmo1gjqnuhv52pd2a7ets2vhw9w9qa9knyhy7y9tgx";
    let bobAddr = "osmo1chgwz55h9kepjq0fkj5supl2ta3nwu63e3ds8x";
    let addresses = [aliceAddr, bobAddr];

    for (let addr of addresses) {
      l(SEP, "debug query assets...");
      try {
        await _cwDebugQueryAssets(addr);
      } catch (error) {
        l(error, "\n");
      }
    }
  }

  async function cwSwap() {
    l(SEP, "swapping...");
    try {
      await _cwSwap();
      // await _queryBalance();
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwDebugQueryBank() {
    l(SEP, "debug querying bank...");
    try {
      await _cwDebugQueryBank();
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwTransfer() {
    l(SEP, "transfering...");
    try {
      await _cwTransfer();
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
    _queryBalance,
    cwDeposit,
    sgGrantStakeAuth,
    cwSwap,
    sgDelegateFrom,
    sgUpdatePoolList,
    cwGetPools,
    cwGetPrices,
    cwDebugQueryPoolsAndUsers,
    cwQueryPoolsAndUsers,
    cwDepositAlice,
    cwDepositBob,
    cwWithdrawAlice,
    cwMockUpdatePoolsAndUsers,
    cwDebugQueryAssets,
    cwDebugQueryBank,
    cwTransfer,
    sgTransfer,
  };
}

export { init };
