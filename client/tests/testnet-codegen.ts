//import { init } from "../src/common/workers/testnet-combined-workers";
import { init } from "../src/common/workers/codegen-worker";

async function main() {
  const { cwDebugQueryPoolsAndUsers, cwDepositAlice } = await init();

  await cwDebugQueryPoolsAndUsers();
  await cwDepositAlice();
  await cwDebugQueryPoolsAndUsers();
}

main();
