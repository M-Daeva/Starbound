import { l, createRequest, specifyTimeout as _specifyTimeout } from "../utils";
import { coin, StdFee } from "@cosmjs/stargate";
import {
  mockUpdatePoolsAndUsers as _mockUpdatePoolsAndUsers,
  _transformGrantList,
} from "../helpers/api-helpers";
import { getCwHelpers } from "../helpers/cw-helpers";
import { DENOMS } from "../helpers/assets";
import { getSgHelpers } from "../helpers/sg-helpers";
import { getAddrByPrefix } from "../signers";
import {
  QueryPoolsAndUsersResponse,
  UserExtracted,
  TransferParams,
  PoolExtracted,
} from "../codegen/Starbound.types";
import {
  DelegationStruct,
  ClientStructWithoutKeplr,
  IbcStruct,
  ChainRegistryStorage,
  BalancesResponse,
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
const dappClientStructJuno: ClientStructWithoutKeplr = {
  prefix: "juno",
  //RPC: "https://rpc.uni.juno.deuslabs.fi:443",
  RPC: "https://rpc.uni.junonetwork.io:443",
  seed: SEED_DAPP,
};

const req = createRequest({});

async function init() {
  // dapp cosmwasm helpers
  const {
    owner: dappAddr,
    cwSwap: _cwSwap,
    cwQueryPoolsAndUsers: _cwQueryPoolsAndUsers,
    cwUpdatePoolsAndUsers: _cwUpdatePoolsAndUsers,
    cwQueryUser: _cwQueryUser,
    cwTransfer: _cwTransfer,
    cwMultiTransfer: _cwMultiTransfer,
  } = await getCwHelpers(dappClientStruct, CONTRACT_ADDRESS);

  // dapp stargate helpers
  const {
    sgUpdatePoolList: _sgUpdatePoolList,
    sgTransfer: _sgTransfer,
    sgSend: _sgSend,
  } = await getSgHelpers(dappClientStruct);

  const {
    sgDelegateFrom: _sgDelegateFrom,
    sgGetTokenBalances: _sgGetTokenBalances,
  } = await getSgHelpers(dappClientStructJuno);

  async function sgUpdatePoolList() {
    let pools = await _sgUpdatePoolList();
    l({ pools });
  }

  async function _queryBalance() {
    let balances = await _sgGetTokenBalances(CONTRACT_ADDRESS);
    l({ contract: balances });
  }

  // const grantStakeStruct: DelegationStruct = {
  //   targetAddr: dappAddr,
  //   tokenAmount: 1_000,
  //   tokenDenom: DENOMS.JUNO,
  //   validatorAddr: "junovaloper1w8cpaaljwrytquj86kvp9s72lvmddcc208ghun",
  // };

  async function sgDelegateFrom(stakeFromStruct: DelegationStruct) {
    try {
      const tx = await _sgDelegateFrom(stakeFromStruct);
      l(tx, "\n");
    } catch (error) {
      l(error, "\n");
    }
  }

  async function sgDelegateFromAll(users: UserExtracted[]) {
    const denom = "ujunox";

    async function delegate(user: UserExtracted) {
      try {
        let addr = getAddrByPrefix(user.osmo_address, "juno");
        let balance = (await _sgGetTokenBalances(addr)).find(
          (item) => item.symbol === denom
        );
        let delegation = balance !== undefined ? +balance.amount - 1000 : 0;

        l(addr, balance, delegation);

        if (delegation >= 1000) {
          let tx = await _sgDelegateFrom({
            targetAddr: addr,
            tokenAmount: delegation,
            tokenDenom: denom,
            validatorAddr: "junovaloper1w8cpaaljwrytquj86kvp9s72lvmddcc208ghun",
          });
          l(tx);
        }
      } catch (error) {
        l(error);
      }
    }

    for (let user of users) {
      await delegate(user);
    }
  }

  async function sgDelegateFromAll2(
    denomGranterValoperList: [string, [string, string][]][],
    chainRegistryResponse: ChainRegistryStorage | undefined,
    chainType: "main" | "test",
    threshold: number = 100_000
  ) {
    if (!chainRegistryResponse) return;

    const grantList = _transformGrantList(denomGranterValoperList);

    for (let grantListItem of grantList) {
      for (let [denom, granter, valoper] of grantListItem) {
        const chain = chainRegistryResponse.find(
          (item) => item.denomNative === denom
        );
        if (!chain) continue;

        let rest: string | undefined;
        let rpc: string | undefined;
        const gasPriceDefault = 125;
        let gasPrice: number = gasPriceDefault;

        if (chainType === "main" && chain.main) {
          rest = chain.main?.apis?.rest?.[0]?.address;
          rpc = chain.main?.apis?.rpc?.[0]?.address;
          gasPrice =
            chain.main.fees.fee_tokens?.[0]?.fixed_min_gas_price ||
            gasPriceDefault;
        }
        if (chainType === "test" && chain.test) {
          rest = chain.test?.apis?.rest?.[0]?.address;
          rpc = chain.test?.apis?.rpc?.[0]?.address;
          gasPrice =
            chain.test.fees.fee_tokens?.[0]?.fixed_min_gas_price ||
            gasPriceDefault;
        }
        if (!rest || !rpc) continue;

        const fee: StdFee = {
          amount: [coin(gasPrice, denom)],
          gas: "500000",
        };

        l({ denom, granter });

        try {
          const urlHolded = `${rest}/cosmos/bank/v1beta1/balances/${granter}`;
          const balHolded: BalancesResponse = await _specifyTimeout(
            req.get(urlHolded),
            10_000
          );
          const balance = balHolded.balances.find(
            (item) => item.denom === denom
          );
          const amount = +(balance?.amount || "0");

          l({ amount });

          // skip delegation if amount <= threshold
          //if (amount <= threshold) return;

          const dappClientStruct: ClientStructWithoutKeplr = {
            prefix: chain.prefix,
            RPC: rpc as string,
            seed: SEED_DAPP,
          };

          const { sgDelegateFrom: _sgDelegateFrom } = await getSgHelpers(
            dappClientStruct
          );

          const tx = await _specifyTimeout(
            _sgDelegateFrom(
              {
                targetAddr: granter,
                // tokenAmount: amount - threshold,
                tokenAmount: 100,
                tokenDenom: denom,
                validatorAddr: valoper,
              },
              fee
            ),
            10_000
          );

          l(tx);
        } catch (error) {
          l(error);
        }
      }
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

  async function cwUpdatePoolsAndUsers(
    pools: PoolExtracted[],
    users: UserExtracted[]
  ) {
    l("cwUpdatePoolsAndUsers");
    try {
      const res = await _cwUpdatePoolsAndUsers(pools, users);
      l(res.rawLog);
    } catch (error) {
      l(error);
    }
  }

  async function cwMockUpdatePoolsAndUsers(
    poolsAndUsers: QueryPoolsAndUsersResponse
  ) {
    l("cwMockUpdatePoolsAndUsers");

    let { pools, users } = poolsAndUsers;

    pools = pools.map((pool) => {
      return { ...pool, price: `${1.1 * +pool.price}` };
    });

    users = users.map((user) => {
      let asset_list = user.asset_list.map((asset) => {
        return { ...asset, wallet_balance: `${+asset.wallet_balance + 1}` };
      });

      return { ...user, asset_list };
    });

    try {
      await _cwUpdatePoolsAndUsers(pools, users);
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwQueryUser() {
    let aliceAddr = "osmo1gjqnuhv52pd2a7ets2vhw9w9qa9knyhy7y9tgx";
    let bobAddr = "osmo1chgwz55h9kepjq0fkj5supl2ta3nwu63e3ds8x";
    let addresses = [aliceAddr, bobAddr];

    for (let addr of addresses) {
      try {
        await _cwQueryUser(addr);
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

  async function cwTransfer() {
    l("cwTransfer");
    try {
      await _cwTransfer();
    } catch (error) {
      l(error, "\n");
    }
  }

  const junoChannel = "channel-1110";
  const junoAddr = "juno1xjeu7n97xs0pv7lxcedat00d6vgyr9m54vefn2";
  const junoRevision = "5";
  const junoHeight = "500000";
  let junoAmount = "1";
  let timeout_in_mins = 5;
  let timestamp = `${Date.now() + timeout_in_mins * 60 * 1000}000000`;

  let junoParams: TransferParams = {
    channel_id: junoChannel,
    to: junoAddr,
    amount: junoAmount,
    denom: DENOMS.JUNO,
    block_revision: junoRevision,
    block_height: junoHeight,
    timestamp,
  };

  let params: TransferParams[] = [
    junoParams,
    //	junoParams
  ];

  async function cwMultiTransfer() {
    l("cwMultiTransfer");
    try {
      await _cwMultiTransfer(params);
    } catch (error) {
      l(error, "\n");
    }
  }

  let ibcStruct: IbcStruct = {
    amount: 1,
    dstPrefix: "juno",
    sourceChannel: junoChannel,
    sourcePort: "transfer",
  };

  async function sgTransfer() {
    try {
      const tx = await _sgTransfer(ibcStruct);
      l(tx, "\n");
    } catch (error) {
      l(error, "\n");
    }
  }

  async function sgSend() {
    try {
      const tx = await _sgSend(CONTRACT_ADDRESS, coin(500_000, "uosmo"));
      l(tx, "\n");
    } catch (error) {
      l(error, "\n");
    }
  }

  return {
    _queryBalance,
    cwSwap,
    sgDelegateFrom,
    sgUpdatePoolList,
    cwQueryPoolsAndUsers,
    cwMockUpdatePoolsAndUsers,
    cwQueryUser,
    cwTransfer,
    cwMultiTransfer,
    cwUpdatePoolsAndUsers,
    sgTransfer,
    sgSend,
    sgDelegateFromAll,
    sgDelegateFromAll2,
  };
}

export { init };
