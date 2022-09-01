import { getData, SigningStargateClient, getAddrByAddr } from "./osmo-signer";
import { coin } from "@cosmjs/stargate";
import { osmosis } from "osmojs";
import {
  MsgSwapExactAmountIn,
  SwapAmountInRoute,
} from "osmojs/types/proto/osmosis/gamm/v1beta1/tx";
import { Long } from "@osmonauts/helpers";

const { swapExactAmountIn } = osmosis.gamm.v1beta1.MessageComposer.withTypeUrl;
const { ADDR, getAliceClient } = getData(true);

const PREFIX = "osmo";
const DENOM = "uosmo";

const gas = {
  amount: [{ denom: DENOM, amount: "0" }],
  gas: "250000",
};

const l = console.log.bind(console);

async function swap(client: SigningStargateClient) {
  const osmoToJunoRoute: SwapAmountInRoute = {
    poolId: 497 as unknown as Long,
    tokenOutDenom:
      "ibc/46B44899322F3CD854D2D46DEEF881958467CDD4B3B10086DA49296BBED94BED",
  };

  const sender = getAddrByAddr(ADDR.ALICE, PREFIX);

  const msgSwapExactAmountIn: MsgSwapExactAmountIn = {
    routes: [osmoToJunoRoute],
    sender,
    tokenIn: coin(`${100_000}`, DENOM),
    tokenOutMinAmount: "1",
  };

  const msg = swapExactAmountIn(msgSwapExactAmountIn);

  const tx = await client.signAndBroadcast(sender, [msg], gas);
  return tx.rawLog;
}

async function getBalance(client: SigningStargateClient) {
  let osmo_addr = getAddrByAddr(ADDR.ALICE, PREFIX);

  return await client.getBalance(osmo_addr, DENOM);
}

async function main() {
  const aliceClient = (await getAliceClient(false)) as SigningStargateClient;

  let res = await getBalance(aliceClient);
  l("\n", res, "\n");

  let res2 = await swap(aliceClient);
  l("\n", res2, "\n");

  res = await getBalance(aliceClient);
  l("\n", res, "\n");
}

main();
