import { coin } from "@cosmjs/stargate";
import { MsgTransfer } from "osmojs/types/proto/ibc/applications/transfer/v1/tx";
import { Long } from "@osmonauts/helpers";
import { MsgGrant, MsgExec } from "cosmjs-types/cosmos/authz/v1beta1/tx";
import { StakeAuthorization } from "cosmjs-types/cosmos/staking/v1beta1/authz";
import { MsgDelegate } from "cosmjs-types/cosmos/staking/v1beta1/tx";
import { Grant } from "cosmjs-types/cosmos/authz/v1beta1/authz";
import { Timestamp } from "cosmjs-types/google/protobuf/timestamp";
import { EncodeObject } from "@cosmjs/proto-signing/build";
import { l } from "../utils";
import { getSgClient, getAddrByPrefix, fee } from "../clients";
import { DelegationStruct, IbcStruct, ClientStruct } from "./interfaces";
import Decimal from "decimal.js";
import { DENOMS, PoolInfo, PoolDatabase } from "./interfaces";

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

  async function _sgUpdatePoolList() {
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
    _sgTransfer,
    _sgGrantStakeAuth,
    _sgDelegateFrom,
    _sgUpdatePoolList,
  };
}

export { getSgHelpers };
