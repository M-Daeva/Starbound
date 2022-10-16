import { coin, DeliverTxResponse } from "@cosmjs/stargate";
import { MsgSwapExactAmountIn } from "osmojs/types/proto/osmosis/gamm/v1beta1/tx";
import { MsgTransfer } from "osmojs/types/proto/ibc/applications/transfer/v1/tx";
import { Long } from "@osmonauts/helpers";
import { MsgGrant, MsgExec } from "cosmjs-types/cosmos/authz/v1beta1/tx";
import { StakeAuthorization } from "cosmjs-types/cosmos/staking/v1beta1/authz";
import { MsgDelegate } from "cosmjs-types/cosmos/staking/v1beta1/tx";
import { Grant } from "cosmjs-types/cosmos/authz/v1beta1/authz";
import { Timestamp } from "cosmjs-types/google/protobuf/timestamp";
import { EncodeObject } from "@cosmjs/proto-signing/build";
import { l, createRequest, r } from "../utils";
import { getSgClient, getAddrByPrefix, fee } from "../clients";
import { getRoutes, DENOMS, getSymbolByDenom } from "../osmo-pools";
import {
  DelegationStruct,
  IbcStruct,
  SwapStruct,
  ClientStruct,
} from "./interfaces";
import Decimal from "decimal.js";

interface AssetDescription {
  symbol: string;
  amount: number;
  denom: string;
  coingecko_id: string;
  liquidity: number;
  liquidity_24h_change: number;
  volume_24h: number;
  volume_24h_change: number;
  volume_7d: number;
  price: number;
  fees: string;
  main: boolean;
}

type PoolDatabase = {
  [poolNumber: string]: AssetDescription[];
};

interface PoolListRawData {
  pools: PoolRawData[];
}

interface PoolRawData {
  "@type": string;
  address: string;
  id: string;
  pool_params: {
    swap_fee: string;
    exit_fee: string;
    smooth_weight_change_params: null;
  };
  future_pool_governor: string;
  total_shares: {
    denom: string;
    amount: string;
  };
  pool_assets: [
    {
      token: {
        denom: string;
        amount: string;
      };
      weight: string;
    },
    {
      token: {
        denom: string;
        amount: string;
      };
      weight: string;
    }
  ];
  total_weight: string;
}

interface PoolInfo {
  id: number;
  denom: string;
  price: Decimal;
}

async function getSgHelpers(clientStruct: ClientStruct) {
  const { client, owner } = await getSgClient(clientStruct);

  async function _sgTransfer(ibcStruct: IbcStruct) {
    const { amount, dstPrefix, sourceChannel, sourcePort } = ibcStruct;
    const receiver = getAddrByPrefix(owner, dstPrefix);

    l({ sender: owner, receiver });

    const height = await client.getHeight();

    const msgIbcTransfer: MsgTransfer = {
      sender: owner,
      receiver,
      token: coin(amount, DENOMS.OSMO),
      sourceChannel,
      sourcePort,
      timeoutHeight: {
        revisionNumber: Long.fromNumber(5),
        revisionHeight: Long.fromNumber(400000),
      },
      timeoutTimestamp: Long.fromNumber(0),
    };

    const msg: EncodeObject = {
      typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
      value: msgIbcTransfer,
    };

    const tx = await client.signAndBroadcast(owner, [msg], fee);

    return tx;
  }

  async function _sgSwap(swapStruct: SwapStruct) {
    const { amount, from, to } = swapStruct;

    const msgSwapExactAmountIn: MsgSwapExactAmountIn = {
      routes: getRoutes(from, to),
      sender: owner,
      tokenIn: coin(amount, DENOMS[from]),
      tokenOutMinAmount: "1",
    };

    const msg: EncodeObject = {
      typeUrl: "/osmosis.gamm.v1beta1.MsgSwapExactAmountIn",
      value: msgSwapExactAmountIn,
    };

    const tx = await client.signAndBroadcast(owner, [msg], fee);

    return tx;
  }

  async function _sgGrantStakeAuth(delegationStruct: DelegationStruct) {
    const { targetAddr, tokenAmount, tokenDenom, validatorAddr } =
      delegationStruct;

    const timestamp: Timestamp = {
      seconds: Long.fromNumber(1_700_000_000),
      nanos: 0,
    };

    const grant: Grant = {
      authorization: {
        typeUrl: "/cosmos.staking.v1beta1.StakeAuthorization",
        value: StakeAuthorization.encode(
          StakeAuthorization.fromPartial({
            allowList: { address: [validatorAddr] },
            maxTokens: coin(tokenAmount, tokenDenom),
            authorizationType: 1,
          })
        ).finish(),
      },
      expiration: timestamp,
    };

    const msgGrant: MsgGrant = {
      granter: owner,
      grantee: targetAddr,
      grant,
    };

    const msg: EncodeObject = {
      typeUrl: "/cosmos.authz.v1beta1.MsgGrant",
      value: msgGrant,
    };

    const tx = await client.signAndBroadcast(owner, [msg], fee);

    return tx;
  }

  async function _sgDelegateFrom(delegationStruct: DelegationStruct) {
    const { targetAddr, tokenAmount, tokenDenom, validatorAddr } =
      delegationStruct;

    const msg1 = {
      typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
      value: MsgDelegate.encode(
        MsgDelegate.fromPartial({
          delegatorAddress: targetAddr,
          validatorAddress: validatorAddr,
          amount: coin(tokenAmount, tokenDenom),
        })
      ).finish(),
    };

    const msgExec: MsgExec = {
      grantee: owner,
      msgs: [msg1],
    };

    const msg: EncodeObject = {
      typeUrl: "/cosmos.authz.v1beta1.MsgExec",
      value: msgExec,
    };

    const tx = await client.signAndBroadcast(owner, [msg], fee);

    return tx;
  }

  async function _sgGetTokenBalances(addr: string = owner) {
    let balances = await client.getAllBalances(addr);
    return balances.map(({ amount, denom }) => ({
      amount,
      symbol: getSymbolByDenom(denom),
    }));
  }

  // async function _sgUpdatePoolList() {
  //   let baseUrl = "https://lcd.osmosis.zone";
  //   let queryNumPoolsUrl = "/osmosis/gamm/v1beta1/num_pools";
  //   let queryPoolsUrl = "/osmosis/gamm/v1beta1/pools";
  //   let pricesUrl =
  //     "https://api-osmosis.imperator.co/pools/v2/all?low_liquidity=false";

  //   let ax = createRequest({ baseURL: baseUrl });

  //   let poolListWithPrices = (await ax.get(pricesUrl)) as PoolDatabase;

  //   // get pagination parameters
  //   let { num_pools } = await ax.get(queryNumPoolsUrl);
  //   let page_amount = Math.ceil(+num_pools / 100);
  //   let page_size = Math.ceil(num_pools / page_amount);

  //   // get pool list raw data
  //   let poolListRawData: PoolRawData[] = [];

  //   for (let i = 0; i < page_amount; i++) {
  //     let res = (await ax.get(queryPoolsUrl, {
  //       params: {
  //         "pagination.limit": page_size,
  //         "pagination.offset": i * page_size,
  //       },
  //     })) as PoolListRawData;

  //     poolListRawData = [...poolListRawData, ...res.pools];
  //   }

  //   // calc osmo price in usdc
  //   const strToDec = (s: string): Decimal => new Decimal(s);

  //   const getMultiplier = (a: string, b: string): Decimal => {
  //     let [max, min] = a > b ? [a, b].map(strToDec) : [b, a].map(strToDec);
  //     let ratio = max.div(min);
  //     let base = new Decimal(3);

  //     for (let i = 0; i < 16; i++) {
  //       let temp = new Decimal(10 ** i);
  //       if (ratio.lessThan(base.mul(temp))) return temp;
  //     }

  //     throw new Error("Multiplier can not be calculated!");
  //   };

  //   const calcPrice = (pool: PoolRawData): Decimal => {
  //     let [assetFirst, assetSecond] = pool.pool_assets;

  //     const [tIn, wIn, tOut, wOut, f] = [
  //       assetFirst.token.amount,
  //       assetFirst.weight,
  //       assetSecond.token.amount,
  //       assetSecond.weight,
  //       pool.pool_params.swap_fee,
  //     ].map(strToDec);

  //     let a = tOut.mul(wIn);
  //     let b = f.neg().add(1).mul(tIn).mul(wOut);

  //     return a.div(b);
  //   };

  //   let [osmoUsdcPool] = poolListRawData.filter(({ id }) => id === "678");
  //   let osmoToUsdcPrice = strToDec("1").div(calcPrice(osmoUsdcPool));

  //   let osmoThreshold = strToDec("1e6").mul(1e5).div(osmoToUsdcPrice).ceil();

  //   // filter pools by liquidity and osmo presence as 2nd asset
  //   let poolListFilteredData = poolListRawData.filter((pool) => {
  //     const [_, assetSecond] = pool.pool_assets;
  //     const { amount, denom } = assetSecond.token;
  //     return denom === "uosmo" && strToDec(amount).greaterThan(osmoThreshold);
  //   });

  //   let poolListData = poolListFilteredData.map((pool) => {
  //     let { id } = pool;
  //     //let poolWithPrices = poolListWithPrices[id].

  //     let price =
  //       pool.id === "678"
  //         ? strToDec("1")
  //         : osmoToUsdcPrice.mul(calcPrice(pool));

  //     return {
  //       id: +pool.id,
  //       denom: pool.pool_assets[0].token.denom,
  //       price,
  //     } as PoolInfo;
  //   });

  //   return poolListData;
  // }

  async function _sgUpdatePoolList() {
    // {
    //   id: 678,
    //   denom: 'ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858',
    //   price: 0.9999999975356814
    // }

    let url =
      "https://api-osmosis.imperator.co/pools/v2/all?low_liquidity=false";

    // download pools info
    let poolDatabase: PoolDatabase = await (await fetch(url)).json();

    // skip low liquidity pools
    let valid_pools: PoolInfo[] = [];
    Object.entries(poolDatabase).forEach(([key, [assetFirst, assetSecond]]) => {
      if (
        assetSecond.denom === "uosmo" &&
        assetSecond.liquidity > 100_000 &&
        key !== "678"
      ) {
        valid_pools.push({
          id: +key,
          denom: assetFirst.denom,
          price: new Decimal(assetFirst.price),
        } as PoolInfo);
      }
    });

    return valid_pools;
  }

  return {
    owner,
    _sgSwap,
    _sgTransfer,
    _sgGrantStakeAuth,
    _sgDelegateFrom,
    _sgGetTokenBalances,
    _sgUpdatePoolList,
  };
}

export { getSgHelpers };
