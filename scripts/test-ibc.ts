import { SigningStargateClient, getAddrByPrefix } from "./osmo-signer";
import { coin } from "@cosmjs/stargate";
import { Long } from "@osmonauts/helpers";
import { DENOMS } from "./osmo-pools";
import { MsgTransfer } from "osmojs/types/proto/ibc/applications/transfer/v1/tx";
import { EncodeObject } from "@cosmjs/proto-signing/build";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { l, fee } from "./helpers";

interface IbcStruct {
  RPC: string;
  seed: string;
  dstPrefix: string;
  sourceChannel: string;
  sourcePort: string;
  amount: number;
}

async function ibcTransfer(ibcStruct: IbcStruct) {
  const PREFIX = "osmo";

  const signer = await DirectSecp256k1HdWallet.fromMnemonic(ibcStruct.seed, {
    prefix: PREFIX,
  });

  const sender = (await signer.getAccounts())[0].address;
  const receiver = getAddrByPrefix(sender, ibcStruct.dstPrefix);
  l({ sender, receiver });

  const client = await SigningStargateClient.connectWithSigner(
    ibcStruct.RPC,
    signer
  );

  const height = await client.getHeight();

  const msgIbcTransfer: MsgTransfer = {
    sender,
    receiver,
    token: coin(ibcStruct.amount, DENOMS.OSMO),
    sourceChannel: ibcStruct.sourceChannel,
    sourcePort: ibcStruct.sourcePort,
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
  l(tx);
  l(`tx status is ${tx.code === 0 ? "success" : "fail"}`);
}

async function main() {
  // from osmo1ll3s59aawh0qydpz2q3xmqf6pwzmj24t9ch58c
  // to wasm1ll3s59aawh0qydpz2q3xmqf6pwzmj24t8l43cp
  const fromOsmotoWasmWbaTestnet: IbcStruct = {
    RPC: "http://localhost:26653/",
    seed: "harsh adult scrub stadium solution impulse company agree tomorrow poem dirt innocent coyote slight nice digital scissors cool pact person item moon double wagon",
    dstPrefix: "wasm",
    sourceChannel: "channel-0",
    sourcePort: "transfer",
    amount: 123,
  };

  ibcTransfer(fromOsmotoWasmWbaTestnet);
}

main();
