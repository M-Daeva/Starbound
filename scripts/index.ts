import {
  getData,
  SigningStargateClient,
  getAddrByPrefix,
  getJunoSigners,
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
const { ADDR, getAliceClient, getBobClient } = getData(true);

const PREFIX = "osmo";

const fee: StdFee = {
  amount: [coin(0, DENOMS.OSMO)],
  gas: "250000",
};

const l = console.log.bind(console);

async function swap(
  client: SigningStargateClient,
  assetFirst: AssetSymbol,
  assetSecond: AssetSymbol,
  amount: number
) {
  const sender = getAddrByPrefix(ADDR.ALICE, PREFIX);

  const routes = getRoutes(assetFirst, assetSecond);

  const msgSwapExactAmountIn: MsgSwapExactAmountIn = {
    routes,
    sender,
    tokenIn: coin(amount, DENOMS[assetFirst]),
    tokenOutMinAmount: "1",
  };

  const msg = swapExactAmountIn(msgSwapExactAmountIn);

  const tx = await client.signAndBroadcast(sender, [msg], fee);
  return tx.rawLog;
}

async function ibcTransfer(
  client: SigningStargateClient,
  ch_id: string,
  p_id: string
) {
  const sender = getAddrByPrefix(ADDR.ALICE, PREFIX);
  const height = await client.getHeight();

  const msgIbcTransfer: MsgTransfer = {
    sender,
    receiver: ADDR.BOB,
    token: coin(1_000, DENOMS.JUNO),
    sourceChannel: ch_id,
    sourcePort: p_id,
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

  const tx = await client.signAndBroadcast(sender, [msg], fee);
  return tx;
}

async function grant(client: SigningStargateClient) {
  const granter = getAddrByPrefix(ADDR.ALICE, PREFIX);
  const grantee = getAddrByPrefix(ADDR.BOB, PREFIX);
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
          maxTokens: coin(5_000, DENOMS.OSMO),
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

  const tx = await client.signAndBroadcast(granter, [msg], fee);
  return tx;
}

async function delegateFrom(client: SigningStargateClient) {
  const granter = getAddrByPrefix(ADDR.ALICE, PREFIX);
  const grantee = getAddrByPrefix(ADDR.BOB, PREFIX);
  const validator = "osmovaloper1c584m4lq25h83yp6ag8hh4htjr92d954kphp96";

  const msg1 = {
    typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
    value: MsgDelegate.encode(
      MsgDelegate.fromPartial({
        delegatorAddress: granter,
        validatorAddress: validator,
        amount: coin(1_000, DENOMS.OSMO),
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

  const tx = await client.signAndBroadcast(grantee, [msg], fee);
  return tx;
}

async function grantJuno(client: SigningStargateClient) {
  const granter = ADDR.ALICE;
  const grantee = ADDR.BOB;
  const validator = "junovaloper100sdeaen0zwjp8tt24sqxvxn43mza0yx8vsc27";

  const fee = {
    amount: [coin(625, "ujunox")],
    gas: "250000",
  };

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
          maxTokens: coin(5_000, "ujunox"),
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

  const tx = await client.signAndBroadcast(granter, [msg], fee);
  return tx;
}

async function delegateFromJuno(client: SigningStargateClient) {
  const granter = ADDR.ALICE;
  const grantee = ADDR.BOB;
  const validator = "junovaloper100sdeaen0zwjp8tt24sqxvxn43mza0yx8vsc27";

  const fee = {
    amount: [coin(625, "ujunox")],
    gas: "250000",
  };

  const msg1 = {
    typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
    value: MsgDelegate.encode(
      MsgDelegate.fromPartial({
        delegatorAddress: granter,
        validatorAddress: validator,
        amount: coin(1_000, "ujunox"),
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

  const tx = await client.signAndBroadcast(grantee, [msg], fee);
  return tx;
}

// async function ibcFromJuno() {
//   // const RPC_TEST = "https://testnet-rpc.osmosis.zone/";
//   const RPC_TEST = "https://rpc.uni.junomint.com:443";

//   // const PREFIX = "osmo";
//   const PREFIX = "juno";

//   const signer = await DirectSecp256k1HdWallet.fromMnemonic(ALICE_SEED_TEST, {
//     prefix: PREFIX,
//   });

//   const client = await SigningStargateClient.connectWithSigner(
//     RPC_TEST,
//     signer,
//     {
//       prefix: PREFIX,
//       gasPrice: GasPrice.fromString("0.1ujunox"),
//     }
//   );

//   const fee: StdFee = {
//     amount: [coin(625, "ujunox")],
//     gas: "250000",
//   };

//   const sender = ADDR.ALICE;
//   const height = await client.getHeight();

//   const msgIbcTransfer: MsgTransfer = {
//     sender,
//     receiver: getAddrByPrefix(ADDR.ALICE, "osmo"),
//     token: coin(1_000, "ujunox"),
//     sourceChannel: "channel-0",
//     sourcePort: "transfer",
//     timeoutHeight: {
//       revisionNumber: Long.fromNumber(1),
//       revisionHeight: Long.fromNumber(height),
//     },
//     timeoutTimestamp: Long.fromNumber(30_000_000_000),
//   };

//   const msg: EncodeObject = {
//     typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
//     value: msgIbcTransfer,
//   };

//   const tx = await client.signAndBroadcast(sender, [msg], fee);
//   return tx;
// }

async function ibcFromMainnet() {
  const RPC = "https://rpc.osmosis.zone/";
  const PREFIX = "osmo";

  const signer = await DirectSecp256k1HdWallet.fromMnemonic(ALICE_SEED_TEST, {
    prefix: PREFIX,
  });

  const client = await SigningStargateClient.connectWithSigner(RPC, signer);

  const sender = getAddrByPrefix(ADDR.ALICE, PREFIX);
  const height = await client.getHeight();

  const msgIbcTransfer: MsgTransfer = {
    sender,
    receiver: "juno1j5ft99lyd36e5fyp8kh8ze7qcj00relm3ja78t",
    token: coin(1_000, DENOMS.JUNO),
    sourceChannel: "channel-42",
    sourcePort: "transfer",
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

  const tx = await client.signAndBroadcast(sender, [msg], fee);
  return tx;
}

async function getAllBalances(client: SigningStargateClient) {
  let osmo_addr = getAddrByPrefix(ADDR.ALICE, PREFIX);

  let balances = await client.getAllBalances(osmo_addr);
  return balances.map(({ amount, denom }) => ({
    amount,
    symbol: getSymbolByDenom(denom),
  }));
}

async function main() {
  const aliceClient = (await getAliceClient(false)) as SigningStargateClient;
  const bobClient = (await getBobClient(false)) as SigningStargateClient;

  //const { aliceJunoClient, bobJunoClient } = await getJunoSigners();

  let res = await getAllBalances(aliceClient);
  l("\n", res, "\n");

  //let res2 = await swap(aliceClient, "OSMO", "JUNO", 500);
  // let res2;
  // for (let channel of channels) {
  //   res2 = await ibcTransfer(aliceClient, channel.channel_id, channel.port_id);
  //   l("\n", channel.channel_id, channel.port_id);
  //   l("\n", res2, "\n");
  // }

  // let res2 = await ibcFromMainnet();
  // l("\n", res2, "\n");

  let res2 = await grant(aliceClient);
  l("\n", res2, "\n");

  res2 = await delegateFrom(bobClient);
  l("\n", res2, "\n");

  // let res2 = await grantJuno(aliceJunoClient);
  // l("\n", res2, "\n");

  // res2 = await delegateFromJuno(bobJunoClient);
  // l("\n", res2, "\n");

  // let tx = await aliceClient.sendTokens(
  //   getAddrByPrefix(ADDR.ALICE, PREFIX),
  //   getAddrByPrefix(ADDR.BOB, PREFIX),
  //   [coin(2_000, DENOMS.OSMO)],
  //   fee
  // );
  // l(tx);

  res = await getAllBalances(aliceClient);
  l("\n", res, "\n");
}

main();
