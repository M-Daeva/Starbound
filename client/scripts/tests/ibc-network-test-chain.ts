import { init } from "../../src/common/workers/testnet-combined-workers";

async function main() {
  const { sgUpdatePoolList, cwGetPools, cwGetPrices, sgTransfer } =
    await init();

  //await sgUpdatePoolList();
  //await cwGetPools();
  //await cwGetPrices();
  await sgTransfer();
}

main();
