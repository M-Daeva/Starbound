import {
  getData,
  SigningStargateClient,
  getAddrByPrefix,
  getJunoSigners,
  SigningCosmWasmClient,
} from "./osmo-signer";
import { coin, StdFee } from "@cosmjs/stargate";
import { osmosis, ibc } from "osmojs";
import {
  MsgSwapExactAmountIn,
  SwapAmountInRoute,
} from "osmojs/types/proto/osmosis/gamm/v1beta1/tx";
import { Long } from "@osmonauts/helpers";
import { getRoutes, DENOMS, getSymbolByDenom, AssetSymbol } from "./osmo-pools";
import { MsgTransfer } from "osmojs/types/proto/ibc/applications/transfer/v1/tx";
import { EncodeObject } from "@cosmjs/proto-signing/build";
import { MsgDelegate } from "cosmjs-types/cosmos/staking/v1beta1/tx";
import { MsgGrant, MsgExec } from "cosmjs-types/cosmos/authz/v1beta1/tx";
import { Grant } from "cosmjs-types/cosmos/authz/v1beta1/authz";
import { Timestamp } from "cosmjs-types/google/protobuf/timestamp";

import { getSigningIbcClient } from "osmojs";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import {
  ALICE_ADDR as ALICE_ADDR_TEST,
  ALICE_SEED as ALICE_SEED_TEST,
  BOB_ADDR as BOB_ADDR_TEST,
  BOB_SEED as BOB_SEED_TEST,
} from "./test_wallets.json";
import { GasPrice } from "@cosmjs/stargate";
import { channels } from "./channels-osmo.json";
import { StakeAuthorization } from "cosmjs-types/cosmos/staking/v1beta1/authz";

const { swapExactAmountIn } = osmosis.gamm.v1beta1.MessageComposer.withTypeUrl;
const { ADDR, CONTR } = getData(true);

const l = console.log.bind(console);

const PREFIX = "osmo";

const fee: StdFee = {
  amount: [coin(0, DENOMS.OSMO)],
  gas: "250000",
};

function initWithSigningStargateClient(
  signingStargateClient: SigningStargateClient
) {
  async function swap(
    senderAddr: string = ADDR.ALICE,
    from: AssetSymbol = "OSMO",
    to: AssetSymbol = "ATOM",
    amount: number = 10_000
  ) {
    const sender = getAddrByPrefix(senderAddr, PREFIX);
    const routes = getRoutes(from, to);

    const msgSwapExactAmountIn: MsgSwapExactAmountIn = {
      routes,
      sender,
      tokenIn: coin(amount, DENOMS[from]),
      tokenOutMinAmount: "1",
    };

    const msg = swapExactAmountIn(msgSwapExactAmountIn);
    const tx = await signingStargateClient.signAndBroadcast(sender, [msg], fee);

    return tx.rawLog;
  }

  async function ibcTransfer(
    senderAddr: string = ADDR.ALICE,
    receiverAddr: string = ADDR.BOB,
    channelId: string = "channel-0",
    portId: string = "transfer",
    tokenAmount: number = 1_000,
    tokenDenom: string = DENOMS.ATOM
  ) {
    const sender = getAddrByPrefix(senderAddr, PREFIX);
    const receiver = getAddrByPrefix(receiverAddr, PREFIX);
    const height = await signingStargateClient.getHeight();

    const msgIbcTransfer: MsgTransfer = {
      sender,
      receiver,
      token: coin(tokenAmount, tokenDenom),
      sourceChannel: channelId,
      sourcePort: portId,
      timeoutHeight: {
        revisionNumber: Long.fromNumber(1),
        revisionHeight: Long.fromNumber(height),
      },
      timeoutTimestamp: Long.fromNumber(30_000_000_000),
    };

    const msg: EncodeObject = {
      typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
      value: msgIbcTransfer,
    };

    const tx = await signingStargateClient.signAndBroadcast(sender, [msg], fee);

    return tx;
  }

  async function grantStakeAuth(
    granterAddr: string = ADDR.ALICE,
    granteeAddr: string = ADDR.BOB,
    tokenAmount: number = 5_000,
    tokenDenom: string = DENOMS.OSMO
  ) {
    const granter = getAddrByPrefix(granterAddr, PREFIX);
    const grantee = getAddrByPrefix(granteeAddr, PREFIX);
    const validator = "osmovaloper1c584m4lq25h83yp6ag8hh4htjr92d954kphp96";

    const timestamp: Timestamp = {
      seconds: Long.fromNumber(1_700_000_000),
      nanos: 0,
    };

    const grant: Grant = {
      authorization: {
        typeUrl: "/cosmos.staking.v1beta1.StakeAuthorization",
        value: StakeAuthorization.encode(
          StakeAuthorization.fromPartial({
            allowList: { address: [validator] },
            maxTokens: coin(tokenAmount, tokenDenom),
            authorizationType: 1,
          })
        ).finish(),
      },
      expiration: timestamp,
    };

    const msgGrant: MsgGrant = {
      granter,
      grantee,
      grant,
    };

    const msg: EncodeObject = {
      typeUrl: "/cosmos.authz.v1beta1.MsgGrant",
      value: msgGrant,
    };

    const tx = await signingStargateClient.signAndBroadcast(
      granter,
      [msg],
      fee
    );

    return tx;
  }

  async function delegateFrom(
    granterAddr: string = ADDR.ALICE,
    granteeAddr: string = ADDR.BOB,
    tokenAmount: number = 5_000,
    tokenDenom: string = DENOMS.OSMO
  ) {
    const granter = getAddrByPrefix(granterAddr, PREFIX);
    const grantee = getAddrByPrefix(granteeAddr, PREFIX);
    const validator = "osmovaloper1c584m4lq25h83yp6ag8hh4htjr92d954kphp96";

    const msg1 = {
      typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
      value: MsgDelegate.encode(
        MsgDelegate.fromPartial({
          delegatorAddress: granter,
          validatorAddress: validator,
          amount: coin(tokenAmount, tokenDenom),
        })
      ).finish(),
    };

    const msgExec: MsgExec = {
      grantee,
      msgs: [msg1],
    };

    const msg: EncodeObject = {
      typeUrl: "/cosmos.authz.v1beta1.MsgExec",
      value: msgExec,
    };

    const tx = await signingStargateClient.signAndBroadcast(
      grantee,
      [msg],
      fee
    );

    return tx;
  }

  async function getAllBalances(addr: string = ADDR.ALICE) {
    let sender = getAddrByPrefix(addr, PREFIX);

    let balances = await signingStargateClient.getAllBalances(sender);
    return balances.map(({ amount, denom }) => ({
      amount,
      symbol: getSymbolByDenom(denom),
    }));
  }

  return { swap, ibcTransfer, grantStakeAuth, delegateFrom, getAllBalances };
}

function initWithSigningCosmWasmClient(
  signingCosmWasmClient: SigningCosmWasmClient
) {
  async function getBankBalance() {
    let res = await signingCosmWasmClient.queryContractSmart(CONTR.ADDR, {
      get_bank_balance: {},
    });
    l("\n", res, "\n");
  }

  async function deposit(
    senderAddr: string = ADDR.ALICE,
    tokenAmount: number = 10_000,
    tokenDenom: string = DENOMS.OSMO
  ) {
    let res = await signingCosmWasmClient.execute(
      getAddrByPrefix(senderAddr, PREFIX),
      CONTR.ADDR,
      { deposit: {} },
      fee,
      "",
      [coin(tokenAmount, tokenDenom)]
    );
    l({ attributes: res.logs[0].events[2].attributes }, "\n");
  }

  async function swap(
    senderAddr: string = ADDR.ALICE,
    from: string = DENOMS.OSMO,
    to: string = DENOMS.ATOM,
    amount: number = 1_000
  ) {
    let res = await signingCosmWasmClient.execute(
      getAddrByPrefix(senderAddr, PREFIX),
      CONTR.ADDR,
      {
        swap_tokens: {
          from,
          to,
          amount,
        },
      },
      fee
    );
    l({ attributes: res.logs[0].events[2].attributes }, "\n");
  }

  return { getBankBalance, deposit, swap };
}

export {
  initWithSigningStargateClient,
  initWithSigningCosmWasmClient,
  PREFIX,
  fee,
};
