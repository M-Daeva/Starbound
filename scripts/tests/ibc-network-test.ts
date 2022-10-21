import { init } from "../workers/ibc-network-workers";

async function main() {
  const { cwMultiTransfer } = await init();

  await cwMultiTransfer();
}

main();
