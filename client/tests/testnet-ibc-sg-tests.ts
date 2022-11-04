import { init } from "../src/common/workers/testnet-combined-workers";

async function main() {
  const { sgTransfer } = await init();

  await sgTransfer();
}

main();
