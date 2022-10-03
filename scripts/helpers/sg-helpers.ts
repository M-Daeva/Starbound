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
import { l } from "../utils";
import { ClientStruct, getSgClient, getAddrByPrefix, fee } from "../clients";
import {
  getRoutes,
  DENOMS,
  getSymbolByDenom,
  AssetSymbol,
} from "../osmo-pools";

interface IbcStruct {
  dstPrefix: string;
  sourceChannel: string;
  sourcePort: string;
  amount: number;
}

interface SwapStruct {
  from: AssetSymbol;
  to: AssetSymbol;
  amount: number;
}

interface DelegationStruct {
  targetAddr: string;
  tokenAmount: number;
  tokenDenom: string;
  validatorAddr: string;
}

async function getSgHelpers(clientStruct: ClientStruct): Promise<{
  owner: string;
  _sgSwap: (swapStruct: SwapStruct) => Promise<DeliverTxResponse>;
  _sgTransfer: (ibcStruct: IbcStruct) => Promise<DeliverTxResponse>;
  _sgGrantStakeAuth: (
    delegationStruct: DelegationStruct
  ) => Promise<DeliverTxResponse>;
  _sgDelegateFrom: (
    delegationStruct: DelegationStruct
  ) => Promise<DeliverTxResponse>;
  _sgGetTokenBalances: (addr?: string) => Promise<
    {
      amount: string;
      symbol: string;
    }[]
  >;
}> {
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

  return {
    owner,
    _sgSwap,
    _sgTransfer,
    _sgGrantStakeAuth,
    _sgDelegateFrom,
    _sgGetTokenBalances,
  };
}

export { getSgHelpers, IbcStruct, SwapStruct, DelegationStruct };
