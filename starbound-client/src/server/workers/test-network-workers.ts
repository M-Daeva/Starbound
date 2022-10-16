import { l } from "../utils";
import { _mockUpdatePoolsAndUsers } from "../helpers/api-helpers";
import { getCwHelpers } from "../helpers/cw-helpers";
import { DENOMS } from "../helpers/interfaces";
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

  const grantStakeStruct: DelegationStruct = {
    targetAddr: dappAddr,
    tokenAmount: 5_000,
    tokenDenom: DENOMS.OSMO,
    validatorAddr: "osmovaloper1c584m4lq25h83yp6ag8hh4htjr92d954kphp96",
  };

  async function sgDelegateFrom(stakeFromStruct: DelegationStruct) {
    try {
      const tx = await _sgDelegateFrom(stakeFromStruct);
      l(tx, "\n");
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwGetPools() {
    try {
      await _cwGetPools();
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwGetPrices() {
    try {
      await _cwGetPrices();
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwDebugQueryPoolsAndUsers() {
    try {
      await _cwDebugQueryPoolsAndUsers();
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwQueryPoolsAndUsers() {
    try {
      return await _cwQueryPoolsAndUsers();
    } catch (error) {
      l(error, "\n");
      let empty: QueryPoolsAndUsersResponse = { pools: [], users: [] };
      return empty;
    }
  }

  async function cwMockUpdatePoolsAndUsers(
    poolsAndUsers: QueryPoolsAndUsersResponse
  ) {
    l("cwMockUpdatePoolsAndUsers");
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
          // {
          //   osmo_address: "osmo1chgwz55h9kepjq0fkj5supl2ta3nwu63e3ds8x",
          //   asset_list: [
          //     {
          //       asset_denom: DENOMS.ATOM,
          //       wallet_address: "cosmos1chgwz55h9kepjq0fkj5supl2ta3nwu63327q35",
          //       wallet_balance: "10000001",
          //     },

          //     {
          //       asset_denom: DENOMS.JUNO,
          //       wallet_address: "juno1chgwz55h9kepjq0fkj5supl2ta3nwu638camkg",
          //       wallet_balance: "10000002",
          //     },
          //   ],
          // },
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
      try {
        await _cwDebugQueryAssets(addr);
      } catch (error) {
        l(error, "\n");
      }
    }
  }

  async function cwSwap() {
    l("cwSwap");
    try {
      await _cwSwap();
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwDebugQueryBank() {
    try {
      await _cwDebugQueryBank();
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwTransfer() {
    l("cwTransfer");
    try {
      await _cwTransfer();
    } catch (error) {
      l(error, "\n");
    }
  }

  return {
    _queryBalance,
    cwSwap,
    sgDelegateFrom,
    sgUpdatePoolList,
    cwGetPools,
    cwGetPrices,
    cwDebugQueryPoolsAndUsers,
    cwQueryPoolsAndUsers,
    cwMockUpdatePoolsAndUsers,
    cwDebugQueryAssets,
    cwDebugQueryBank,
    cwTransfer,
  };
}

export { init };
