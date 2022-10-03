import { init } from "../workers/ibc-network-workers";

async function main() {
  const { sgSwap, sgTransfer } = await init();

  await sgTransfer();
  // await sgSwap(); // Error: Unregistered type url: /osmosis.gamm.v1beta1.MsgSwapExactAmountIn
}

main();
