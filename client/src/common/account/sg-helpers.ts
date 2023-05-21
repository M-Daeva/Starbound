import Long from "long";
import { StakeAuthorization } from "cosmjs-types/cosmos/staking/v1beta1/authz";
import { MsgDelegate } from "cosmjs-types/cosmos/staking/v1beta1/tx";
import { Grant } from "cosmjs-types/cosmos/authz/v1beta1/authz";
import { Timestamp } from "cosmjs-types/google/protobuf/timestamp";
import { l } from "../utils";
import { getSgClient, fee, signAndBroadcastWrapper } from "./clients";
import { DelegationStruct } from "../interfaces";
import {
  DirectSecp256k1HdWallet,
  OfflineSigner,
  OfflineDirectSigner,
  EncodeObject,
} from "@cosmjs/proto-signing";
import {
  MsgGrant,
  MsgExec,
  MsgRevoke,
} from "cosmjs-types/cosmos/authz/v1beta1/tx";
import {
  coin,
  MsgSendEncodeObject,
  Coin,
  StdFee,
  SigningStargateClient,
  StargateClient,
} from "@cosmjs/stargate";

async function getSgExecHelpers(
  rpc: string,
  owner: string,
  signer: (OfflineSigner & OfflineDirectSigner) | DirectSecp256k1HdWallet
) {
  const sgClient = await getSgClient(rpc, owner, signer);
  if (!sgClient) return;

  const client = sgClient.client as SigningStargateClient;
  const signAndBroadcast = signAndBroadcastWrapper(client, owner);

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

  async function sgDelegateFromList(
    delegationStructList: DelegationStruct[],
    gasPrice: string
  ) {
    const msgList = delegationStructList.map(
      ({ targetAddr, tokenAmount, tokenDenom, validatorAddr }) => ({
        typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
        value: MsgDelegate.encode(
          MsgDelegate.fromPartial({
            delegatorAddress: targetAddr,
            validatorAddress: validatorAddr,
            amount: coin(tokenAmount, tokenDenom),
          })
        ).finish(),
      })
    );

    const msgExec: MsgExec = {
      grantee: owner,
      msgs: msgList,
    };

    const obj: EncodeObject = {
      typeUrl: "/cosmos.authz.v1beta1.MsgExec",
      value: msgExec,
    };

    return await signAndBroadcast([obj], gasPrice);
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
    sgGrantStakeAuth,
    sgRevokeStakeAuth,
    sgDelegateFrom,
    sgSend,
    sgDelegateFromList,
  };
}

async function getSgQueryHelpers(rpc: string) {
  const sgClient = await getSgClient(rpc);
  if (!sgClient) return;

  const client: StargateClient = sgClient.client;

  async function getAllBalances(address: string) {
    const res = await client.getAllBalances(address);
    return res;
  }

  return { getAllBalances };
}

export { getSgExecHelpers, getSgQueryHelpers };
