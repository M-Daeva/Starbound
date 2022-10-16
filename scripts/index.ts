import { init } from "./workers/test-network-workers";

async function main() {
  const { sgUpdatePoolList, cwGetPools, cwGetPrices, sgTransfer } =
    await init();

  //await sgUpdatePoolList();
  //await cwGetPools();
  //await cwGetPrices();
  await sgTransfer();
}

main();
