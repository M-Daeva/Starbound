import { init } from "./workers/test-network-workers";

async function main() {
  const { sgUpdatePoolList, cwGetPools, cwGetPrices } = await init();

  //await sgUpdatePoolList();
  //await cwGetPools();
  await cwGetPrices();
}

main();
