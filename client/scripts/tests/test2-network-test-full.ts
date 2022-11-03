import { init } from "../../src/common/workers/testnet-combined-workers";

async function main() {
  const {
    cwDebugQueryPoolsAndUsers,
    cwQueryPoolsAndUsers,
    cwDepositAlice,
    cwDepositBob,
    cwWithdrawAlice,
    cwMockUpdatePoolsAndUsers,
    cwQueryAssets,
    cwSwap,
    cwDebugQueryBank,
    cwTransfer,
  } = await init();

  await cwDebugQueryPoolsAndUsers();
  await cwDebugQueryBank();

  await cwDepositAlice();
  await cwDepositBob();
  await cwDebugQueryPoolsAndUsers();
  await cwQueryAssets();
  await cwDebugQueryBank();

  await cwWithdrawAlice();
  await cwDebugQueryPoolsAndUsers();
  await cwQueryAssets();
  await cwDebugQueryBank();

  let poolsAndUsers = await cwQueryPoolsAndUsers();
  await cwMockUpdatePoolsAndUsers();
  await cwDebugQueryPoolsAndUsers();
  await cwQueryAssets();
  await cwDebugQueryBank();

  await cwSwap();
  await cwDebugQueryPoolsAndUsers();
  await cwQueryAssets();
  await cwDebugQueryBank();

  await cwTransfer();
  await cwDebugQueryPoolsAndUsers();
  await cwQueryAssets();
  await cwDebugQueryBank();

  let cnt = 3;

  while (cnt-- !== 0) {
    await cwSwap();
    await cwDebugQueryPoolsAndUsers();
    await cwQueryAssets();
    await cwDebugQueryBank();

    await cwTransfer();
    await cwDebugQueryPoolsAndUsers();
    await cwQueryAssets();
    await cwDebugQueryBank();
  }
}

main();
