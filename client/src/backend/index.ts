import express from "express";
import { l } from "../common/utils";
import { text, json } from "body-parser";
import cors from "cors";
import E from "./config";
import { rootPath } from "../common/utils";
import { init } from "../common/workers/testnet-backend-workers";

async function process() {
  const {
    cwSwap,
    cwTransfer,
    cwMockUpdatePoolsAndUsers,
    cwQueryPoolsAndUsers,
    sgDelegateFromAll,
  } = await init();

  setInterval(async () => {
    let poolsAndUsers = await cwQueryPoolsAndUsers();
    await sgDelegateFromAll(poolsAndUsers.users);
    await cwMockUpdatePoolsAndUsers(poolsAndUsers);
    await cwSwap();
    await cwTransfer();
  }, 30_000);
}

express()
  .use(cors(), text(), json())
  .use(express.static(rootPath("./dist/frontend")))

  .listen(E.PORT, () => {
    l(`Ready on port ${E.PORT}`);
    process();
  });
