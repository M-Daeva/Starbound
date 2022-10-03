import { init } from "../workers/ibc-network-workers";

async function main() {
  const { _queryBalance, cwDeposit, cwTransfer, cwSwap } = await init();

  await _queryBalance();
  await cwDeposit();
  await cwTransfer();
  // await cwSwap();
}

main();
