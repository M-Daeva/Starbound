import { init } from "../src/common/workers/localnet-ibc-workers";

async function main() {
  const { cwMultiTransfer } = await init();

  await cwMultiTransfer();
}

main();
