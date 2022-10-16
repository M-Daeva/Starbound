import { init } from "../workers/test-network-workers";

async function main() {
  const {
    cwDebugQueryPoolsAndUsers,
    cwQueryPoolsAndUsers,
    cwDepositAlice,
    cwDepositBob,
    cwWithdrawAlice,
    cwMockUpdatePoolsAndUsers,
    cwDebugQueryAssets,
    cwSwap,
    cwDebugQueryBank,
    cwTransfer,
  } = await init();

  await cwDebugQueryPoolsAndUsers();
  await cwDebugQueryBank();

  await cwDepositAlice();
  await cwDepositBob();
  await cwDebugQueryPoolsAndUsers();
  await cwDebugQueryAssets();
  await cwDebugQueryBank();

  await cwWithdrawAlice();
  await cwDebugQueryPoolsAndUsers();
  await cwDebugQueryAssets();
  await cwDebugQueryBank();

  let poolsAndUsers = await cwQueryPoolsAndUsers();
  await cwMockUpdatePoolsAndUsers();
  await cwDebugQueryPoolsAndUsers();
  await cwDebugQueryAssets();
  await cwDebugQueryBank();

  await cwSwap();
  await cwDebugQueryPoolsAndUsers();
  await cwDebugQueryAssets();
  await cwDebugQueryBank();

  await cwTransfer();
  await cwDebugQueryPoolsAndUsers();
  await cwDebugQueryAssets();
  await cwDebugQueryBank();

  let cnt = 3;

  while (cnt-- !== 0) {
    await cwSwap();
    await cwDebugQueryPoolsAndUsers();
    await cwDebugQueryAssets();
    await cwDebugQueryBank();

    await cwTransfer();
    await cwDebugQueryPoolsAndUsers();
    await cwDebugQueryAssets();
    await cwDebugQueryBank();
  }
}

main();
