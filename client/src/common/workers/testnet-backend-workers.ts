import { l, createRequest, specifyTimeout as _specifyTimeout } from "../utils";
import { coin } from "@cosmjs/stargate";
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
    // cwMultiTransfer: _cwMultiTransfer,
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

  async function sgDelegateFromAll(
    denomGranterValoperList: [string, [string, string][]][],
    chainRegistryResponse: ChainRegistryStorage | undefined,
    chainType: "main" | "test",
    threshold: number = 100_000
  ) {
    const gasPriceAmountDefault = "0.005"; // 0.0025 min
    const estimatedAddressAmount = 100;
    const gasAmountPerAddress = 140_000;
    const gasLimit = estimatedAddressAmount * gasAmountPerAddress;

    if (!chainRegistryResponse) return;

    for (let [denom, granterValoperList] of denomGranterValoperList) {
      if (denom === "ujuno" && chainType === "test") denom = "ujunox";

      const chain = chainRegistryResponse.find(
        (item) => item.denomNative === denom
      );
      if (!chain) continue;

      let gasPriceAmount: string = "0";
      let rest: string | undefined;
      let rpc: string | undefined;

      if (chainType === "main" && chain.main) {
        rest = chain.main?.apis?.rest?.[0]?.address;
        rpc = chain.main?.apis?.rpc?.[0]?.address;
        const minGasPrice =
          chain.main.fees.fee_tokens?.[0]?.fixed_min_gas_price?.toString();
        if (minGasPrice) gasPriceAmount = minGasPrice;
      }
      if (chainType === "test" && chain.test) {
        rest = chain.test?.apis?.rest?.[0]?.address;
        rpc = chain.test?.apis?.rpc?.[0]?.address;
        const minGasPrice =
          chain.test.fees.fee_tokens?.[0]?.fixed_min_gas_price?.toString();
        if (minGasPrice) gasPriceAmount = minGasPrice;
      }
      if (!rest || !rpc) continue;

      gasPriceAmount = Math.max(
        +gasPriceAmountDefault,
        +gasPriceAmount
      ).toString();

      const gasPrice = `${gasPriceAmount}${denom}`;

      const dappClientStruct: ClientStructWithoutKeplr = {
        prefix: chain.prefix,
        RPC: rpc,
        seed: SEED_DAPP,
      };

      const { sgDelegateFromList: _sgDelegateFromList } = await getSgHelpers(
        dappClientStruct
      );

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
            // tokenAmount: amount - threshold,
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
          _sgDelegateFromList(delegationStructList, gasLimit, gasPrice),
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

  return {
    _queryBalance,
    cwSwap,
    sgDelegateFrom,
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
  };
}

export { init };
