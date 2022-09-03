import { getData, SigningStargateClient, getAddrByAddr } from "./osmo-signer";
import { coin, StdFee } from "@cosmjs/stargate";
import { osmosis } from "osmojs";
import {
  MsgSwapExactAmountIn,
  SwapAmountInRoute,
} from "osmojs/types/proto/osmosis/gamm/v1beta1/tx";
import { Long } from "@osmonauts/helpers";
import { getRoutes, DENOMS, getSymbolByDenom, AssetSymbol } from "./osmo-pools";

const { swapExactAmountIn } = osmosis.gamm.v1beta1.MessageComposer.withTypeUrl;
const { ADDR, getAliceClient } = getData(true);

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
  const sender = getAddrByAddr(ADDR.ALICE, PREFIX);

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

async function getAllBalances(client: SigningStargateClient) {
  let osmo_addr = getAddrByAddr(ADDR.ALICE, PREFIX);

  let balances = await client.getAllBalances(osmo_addr);
  return balances.map(({ amount, denom }) => ({
    amount,
    symbol: getSymbolByDenom(denom),
  }));
}

async function main() {
  const aliceClient = (await getAliceClient(false)) as SigningStargateClient;

  let res = await getAllBalances(aliceClient);
  l("\n", res, "\n");

  let res2 = await swap(aliceClient, "OSMO", "JUNO", 500);
  l("\n", res2, "\n");

  res = await getAllBalances(aliceClient);
  l("\n", res, "\n");
}

main();
