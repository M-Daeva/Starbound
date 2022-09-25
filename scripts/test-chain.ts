import { SigningStargateClient, getAddrByPrefix } from "./osmo-signer";
import { coin } from "@cosmjs/stargate";
import { Long } from "@osmonauts/helpers";
import { DENOMS, AssetSymbol, getRoutes } from "./osmo-pools";
import { MsgTransfer } from "osmojs/types/proto/ibc/applications/transfer/v1/tx";
import { EncodeObject } from "@cosmjs/proto-signing/build";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { l, fee, SEP } from "./helpers";
import { MsgSwapExactAmountIn } from "osmojs/types/proto/osmosis/gamm/v1beta1/tx";

interface ClientStruct {
  RPC: string;
  seed: string;
}

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

async function init(clientStruct: ClientStruct) {
  const { RPC, seed } = clientStruct;

  const PREFIX = "osmo";

  const signer = await DirectSecp256k1HdWallet.fromMnemonic(seed, {
    prefix: PREFIX,
  });

  const sender = (await signer.getAccounts())[0].address;

  const client = await SigningStargateClient.connectWithSigner(RPC, signer);

  async function transfer(ibcStruct: IbcStruct) {
    const { amount, dstPrefix, sourceChannel, sourcePort } = ibcStruct;
    const receiver = getAddrByPrefix(sender, dstPrefix);

    l({ sender, receiver });

    const height = await client.getHeight();

    const msgIbcTransfer: MsgTransfer = {
      sender,
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

    const tx = await client.signAndBroadcast(sender, [msg], fee);
    l(tx, "\n");
  }

  async function swap(swapStruct: SwapStruct) {
    const { amount, from, to } = swapStruct;

    const msgSwapExactAmountIn: MsgSwapExactAmountIn = {
      routes: getRoutes(from, to),
      sender,
      tokenIn: coin(amount, DENOMS[from]),
      tokenOutMinAmount: "1",
    };

    const msg: EncodeObject = {
      typeUrl: "/osmosis.gamm.v1beta1.MsgSwapExactAmountIn",
      value: msgSwapExactAmountIn,
    };

    const tx = await client.signAndBroadcast(sender, [msg], fee);

    l(tx, "\n");
  }

  return { transfer, swap };
}

async function main() {
  const { swap, transfer } = await init({
    RPC: "http://localhost:26653/",
    seed: "harsh adult scrub stadium solution impulse company agree tomorrow poem dirt innocent coyote slight nice digital scissors cool pact person item moon double wagon",
  });

  // from osmo1ll3s59aawh0qydpz2q3xmqf6pwzmj24t9ch58c
  // to wasm1ll3s59aawh0qydpz2q3xmqf6pwzmj24t8l43cp
  const fromOsmotoWasmWbaTestnet: IbcStruct = {
    dstPrefix: "wasm",
    sourceChannel: "channel-0",
    sourcePort: "transfer",
    amount: 123,
  };

  try {
    l(SEP, "sending ibc transfer...");
    await transfer(fromOsmotoWasmWbaTestnet);
  } catch (error) {
    l(error, "\n");
  }

  const fromOsmoToAtom: SwapStruct = {
    from: "OSMO",
    to: "ATOM",
    amount: 1_000,
  };

  try {
    l(SEP, "executing swap...");
    // Error: Unregistered type url: /osmosis.gamm.v1beta1.MsgSwapExactAmountIn
    await swap(fromOsmoToAtom);
  } catch (error) {
    l(error, "\n");
  }
}

main();
