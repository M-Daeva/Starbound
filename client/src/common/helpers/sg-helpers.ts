import { coin, MsgSendEncodeObject, Coin, StdFee } from "@cosmjs/stargate";
import { MsgTransfer } from "osmojs/types/codegen/ibc/applications/transfer/v1/tx";
import Long from "osmojs/node_modules/long";
import {
  MsgGrant,
  MsgExec,
  MsgRevoke,
} from "cosmjs-types/cosmos/authz/v1beta1/tx";
import { StakeAuthorization } from "cosmjs-types/cosmos/staking/v1beta1/authz";
import { MsgDelegate } from "cosmjs-types/cosmos/staking/v1beta1/tx";
import { Grant } from "cosmjs-types/cosmos/authz/v1beta1/authz";
import { Timestamp } from "cosmjs-types/google/protobuf/timestamp";
import { EncodeObject } from "@cosmjs/proto-signing/build";
import { l, createRequest } from "../utils";
import { getSgClient, getAddrByPrefix, fee } from "../signers";
import {
  DelegationStruct,
  IbcStruct,
  ClientStruct,
  SwapStruct,
} from "./interfaces";
import Decimal from "decimal.js";
import { PoolInfo, PoolDatabase } from "./interfaces";
import { MsgSwapExactAmountIn } from "osmojs/types/codegen/osmosis/gamm/v1beta1/tx";
import { getRoutes, getSymbolByDenom, DENOMS } from "./assets";

const req = createRequest({});

async function getSgHelpers(clientStruct: ClientStruct) {
  const { client, owner } = await getSgClient(clientStruct);

  async function sgTransfer(ibcStruct: IbcStruct) {
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
        revisionNumber: Long.fromNumber(1),
        revisionHeight: Long.fromNumber(height),
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

  async function sgSwap(swapStruct: SwapStruct) {
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

  async function sgGrantStakeAuth(delegationStruct: DelegationStruct) {
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

  async function sgRevokeStakeAuth(delegationStruct: DelegationStruct) {
    const { targetAddr } = delegationStruct;
    l({ targetAddr });
    const msgRevoke: MsgRevoke = {
      granter: owner,
      grantee: targetAddr,
      msgTypeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
    };

    const msg: EncodeObject = {
      typeUrl: "/cosmos.authz.v1beta1.MsgRevoke",
      value: msgRevoke,
    };

    const tx = await client.signAndBroadcast(owner, [msg], fee);

    return tx;
  }

  async function sgDelegateFrom(
    delegationStruct: DelegationStruct,
    specifiedFee: StdFee = fee
  ) {
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

    const tx = await client.signAndBroadcast(owner, [msg], specifiedFee);

    return tx;
  }

  async function sgGetTokenBalances(addr: string = owner) {
    let balances = await client.getAllBalances(addr);
    return balances.map(({ amount, denom }) => ({
      amount,
      symbol: getSymbolByDenom(denom),
    }));
  }

  async function sgUpdatePoolList() {
    let url =
      "https://api-osmosis.imperator.co/pools/v2/all?low_liquidity=false";

    // download pools info
    let poolDatabase: PoolDatabase = await req.get(url);

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

  async function sgSend(recipient: string, amount: Coin) {
    const msg: MsgSendEncodeObject = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: {
        fromAddress: owner,
        toAddress: recipient,
        amount: [amount],
      },
    };
    const tx = await client.signAndBroadcast(owner, [msg], fee);
    return tx;
  }

  return {
    owner,
    sgSwap,
    sgTransfer,
    sgGrantStakeAuth,
    sgRevokeStakeAuth,
    sgDelegateFrom,
    sgGetTokenBalances,
    sgUpdatePoolList,
    sgSend,
  };
}

export { getSgHelpers };
