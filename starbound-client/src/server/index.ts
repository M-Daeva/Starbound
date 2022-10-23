import express from "express";
import { l } from "./utils";
import { text, json } from "body-parser";
import cors from "cors";
import E from "./config";
import { rootPath } from "./helpers";
import { init } from "./workers/test-network-workers";

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
  .use(express.static(rootPath("./dist/client")))

  .listen(E.PORT, () => {
    l(`Ready on port ${E.PORT}`);
    process();
  });
