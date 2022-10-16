import express from "express";
import { l } from "./utils";
import { text, json } from "body-parser";
import cors from "cors";
import E from "./config";
import { rootPath } from "./helpers";
import { init } from "./workers/test-network-workers";
import { DelegationStruct, DENOMS } from "./helpers/interfaces";

async function process() {
  const {
    cwSwap,
    cwTransfer,
    cwMockUpdatePoolsAndUsers,
    cwQueryPoolsAndUsers,
    sgDelegateFrom,
  } = await init();

  // let poolsAndUsers = await cwQueryPoolsAndUsers();
  // await cwMockUpdatePoolsAndUsers(poolsAndUsers);
  // await cwSwap();
  // await cwTransfer();

  setInterval(async () => {
    let poolsAndUsers = await cwQueryPoolsAndUsers();
    await cwMockUpdatePoolsAndUsers(poolsAndUsers);
    await cwSwap();
    await cwTransfer();
  }, 60_000);
}

express()
  .use(cors(), text(), json())
  .use(express.static(rootPath("./dist/client")))

  .listen(E.PORT, () => {
    l(`Ready on port ${E.PORT}`);
    process();
  });
