import { init } from "../workers/test-network-workers";

async function main() {
  const { _queryBalance, cwDeposit, cwSwap, sgDelegateFrom, sgGrantStakeAuth } =
    await init();

  await _queryBalance();
  await cwDeposit();
  await cwSwap();
  await sgGrantStakeAuth();
  await sgDelegateFrom();
}

main();
