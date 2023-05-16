import { init } from "../src/common/workers/testnet-combined-workers";

async function main() {
  const helpers = await init();
  if (!helpers) return;

  const {
    cwQueryPoolsAndUsers,
    cwDepositAlice,
    cwDepositBob,
    cwWithdrawAlice,
    cwMockUpdatePoolsAndUsers,
    cwQueryUser,
    cwSwap,
    cwTransfer,
  } = helpers;

  let r = await cwQueryPoolsAndUsers();
  console.log(r);

  // await cwDepositAlice();
  // await cwDepositBob();
  // await cwQueryUser();

  // await cwWithdrawAlice();
  // await cwQueryUser();

  // let poolsAndUsers = await cwQueryPoolsAndUsers();
  // await cwMockUpdatePoolsAndUsers();
  // await cwQueryUser();

  // await cwSwap();
  // await cwQueryUser();

  // await cwTransfer();
  // await cwQueryUser();

  // let cnt = 3;

  // while (cnt--) {
  //   await cwSwap();
  //   await cwQueryUser();

  //   await cwTransfer();
  //   await cwQueryUser();
  // }
}

main();
