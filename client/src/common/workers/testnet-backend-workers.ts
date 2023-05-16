import {
  l,
  createRequest,
  specifyTimeout as _specifyTimeout,
  decrypt,
} from "../utils";
import { coin } from "@cosmjs/stargate";
import { getGasPriceFromChainRegistryItem } from "../signers";
import { getCwHelpers } from "../helpers/cw-helpers";
import { getSgHelpers } from "../helpers/sg-helpers";
import {
  mockUpdatePoolsAndUsers as _mockUpdatePoolsAndUsers,
  _transformGrantList,
} from "../helpers/api-helpers";
import {
  QueryPoolsAndUsersResponse,
  UserExtracted,
  // TransferParams,
  PoolExtracted,
} from "../codegen/StarboundOsmosis.types";
import {
  DelegationStruct,
  ClientStructWithoutKeplr,
  IbcStruct,
  ChainRegistryStorage,
  BalancesResponse,
  UpdateConfigStruct,
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

const req = createRequest({});

async function init(seed: string) {
  const dappClientStruct: ClientStructWithoutKeplr = {
    prefix: PREFIX,
    RPC,
    seed,
  };

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
    cwUpdateConfig: _cwUpdateConfig,
    cwQueryConfig: _cwQueryConfig,
    // cwMultiTransfer: _cwMultiTransfer,
  } = dappCwHelpers;

  // dapp stargate helpers
  const dappSgHelpers = await getSgHelpers(dappClientStruct);
  if (!dappSgHelpers) return;

  const {
    sgUpdatePoolList: _sgUpdatePoolList,
    sgTransfer: _sgTransfer,
    sgSend: _sgSend,
  } = dappSgHelpers;

  async function sgUpdatePoolList() {
    let pools = await _sgUpdatePoolList();
    l({ pools });
  }

  async function sgDelegateFromAll(
    denomGranterValoperList: [string, [string, string][]][],
    chainRegistryResponse: ChainRegistryStorage | undefined,
    chainType: "main" | "test",
    threshold: number = 10_000
  ) {
    if (!chainRegistryResponse) return;

    for (let [denom, granterValoperList] of denomGranterValoperList) {
      if (denom === "ujuno" && chainType === "test") denom = "ujunox";

      const chain = chainRegistryResponse.find(
        (item) => item.denomNative === denom
      );
      if (!chain) continue;

      let rest: string | undefined;
      let rpc: string | undefined;

      if (chainType === "main" && chain.main) {
        rest = chain.main?.apis?.rest?.[0]?.address;
        rpc = chain.main?.apis?.rpc?.[0]?.address;
      }
      if (chainType === "test" && chain.test) {
        rest = chain.test?.apis?.rest?.[0]?.address;
        rpc = chain.test?.apis?.rpc?.[0]?.address;
      }
      if (!rest || !rpc) continue;

      const gasPrice = getGasPriceFromChainRegistryItem(chain, chainType);

      const dappClientStruct: ClientStructWithoutKeplr = {
        prefix: chain.prefix,
        RPC: rpc,
        seed,
      };

      const dappSgHelpers = await getSgHelpers(dappClientStruct);
      if (!dappSgHelpers) return;

      const { sgDelegateFromList: _sgDelegateFromList } = dappSgHelpers;

      let delegationStructList: DelegationStruct[] = [];

      for (let [granter, valoper] of granterValoperList) {
        const urlHolded = `${rest}/cosmos/bank/v1beta1/balances/${granter}`;

        try {
          const balHolded: BalancesResponse = await _specifyTimeout(
            req.get(urlHolded),
            10_000
          );
          const balance = balHolded.balances.find(
            (item) => item.denom === denom
          );
          const amount = +(balance?.amount || "0");

          // skip delegation if amount <= threshold
          //if (amount <= threshold) return;

          const delegationStruct: DelegationStruct = {
            targetAddr: granter,
            //tokenAmount: amount - threshold,
            tokenAmount: 1,
            tokenDenom: denom,
            validatorAddr: valoper,
          };

          delegationStructList.push(delegationStruct);
        } catch (error) {
          l(error);
        }
      }

      try {
        const tx = await _specifyTimeout(
          _sgDelegateFromList(delegationStructList, gasPrice),
          10_000
        );

        l(tx);
      } catch (error) {
        l(error);
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
    users: UserExtracted[],
    gasPrice: string
  ) {
    l("cwUpdatePoolsAndUsers");
    try {
      const res = await _cwUpdatePoolsAndUsers(pools, users, gasPrice);
      l(res.rawLog);
    } catch (error) {
      l(error);
    }
  }

  async function cwMockUpdatePoolsAndUsers(
    poolsAndUsers: QueryPoolsAndUsersResponse,
    gasPrice: string
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
      await _cwUpdatePoolsAndUsers(pools, users, gasPrice);
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

  async function cwSwap(gasPrice: string) {
    l("cwSwap");
    try {
      await _cwSwap(gasPrice);
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwTransfer(gasPrice: string) {
    l("cwTransfer");
    try {
      await _cwTransfer(gasPrice);
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

  // let junoParams: TransferParams = {
  //   channel_id: junoChannel,
  //   to: junoAddr,
  //   amount: junoAmount,
  //   denom: DENOMS.JUNO,
  //   block_revision: junoRevision,
  //   block_height: junoHeight,
  //   timestamp,
  // };

  // let params: TransferParams[] = [
  //   junoParams,
  //   //	junoParams
  // ];

  // async function cwMultiTransfer() {
  //   l("cwMultiTransfer");
  //   try {
  //     await _cwMultiTransfer(params);
  //   } catch (error) {
  //     l(error, "\n");
  //   }
  // }

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

  async function cwQueryConfig() {
    try {
      return await _cwQueryConfig();
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwUpdateConfig(
    updateConfigStruct: UpdateConfigStruct,
    gasPrice: string
  ) {
    try {
      return await _cwUpdateConfig(updateConfigStruct, gasPrice);
    } catch (error) {
      l(error, "\n");
    }
  }

  return {
    cwSwap,
    sgUpdatePoolList,
    cwQueryPoolsAndUsers,
    cwMockUpdatePoolsAndUsers,
    cwQueryUser,
    cwTransfer,
    // cwMultiTransfer,
    cwUpdatePoolsAndUsers,
    sgTransfer,
    sgSend,
    sgDelegateFromAll,
    cwQueryConfig,
    cwUpdateConfig,
  };
}

export { init };
