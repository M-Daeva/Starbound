import { init } from "../src/common/workers/localnet-ibc-workers";

async function main() {
  const helpers = await init();
  if (!helpers) return;

  const { cwMultiTransfer } = helpers;

  await cwMultiTransfer();
}

main();
