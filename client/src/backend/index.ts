import express from "express";
import { l, createRequest } from "../common/utils";
import { text, json } from "body-parser";
import cors from "cors";
import E from "./config";
import { rootPath } from "../common/utils";
import { init } from "../common/workers/testnet-backend-workers";
import dashboard from "./routes/dashboard";
import assets from "./routes/assets";
import bank from "./routes/bank";
import { api, ROUTES as API_ROUTES } from "./routes/api";

let req = createRequest({ baseURL: E.BASE_URL + "/api" });

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

// async function initStorages() {
//   let res = await Promise.all(
//     [
//       API_ROUTES.updateChainRegistry,
//       API_ROUTES.updateIbcChannels,
//       API_ROUTES.updatePools,
//       API_ROUTES.updatePoolsAndUsers,
//       API_ROUTES.updateValidators,
//       API_ROUTES.updateUserFunds,
//     ].map(req.get)
//   );
//   l({ isStorageUpdated: res });
// }

async function initStorages() {
  let res = await req.get(API_ROUTES.updateAll);
  l(res);
}

express()
  .use(cors(), text(), json())
  .use(express.static(rootPath("./dist/frontend")))
  .use("/dashboard", dashboard)
  .use("/assets", assets)
  .use("/bank", bank)
  .use("/api", api)

  .listen(E.PORT, async () => {
    l(`Ready on port ${E.PORT}`);
    // process();

    await initStorages();
    setInterval(initStorages, 5 * 60 * 1000);
  });
