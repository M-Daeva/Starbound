import express from "express";
import { l, createRequest } from "../common/utils";
import { text, json } from "body-parser";
import cors from "cors";
import E from "./config";
import { rootPath } from "../common/utils";
import {
  updatePoolsAndUsers as _updatePoolsAndUsers,
  _getAllGrants,
} from "../common/helpers/api-helpers";
import { ChainRegistryStorage } from "../common/helpers/interfaces";
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
    cwQueryPoolsAndUsers,
    sgDelegateFromAll,
    sgDelegateFromAll2,
    cwUpdatePoolsAndUsers,
  } = await init();

  // const chainRegistry: ChainRegistryStorage = await req.get(
  //   API_ROUTES.getChainRegistry
  // );

  // const grantList = await _getAllGrants(
  //   "osmo18tnvnwkklyv4dyuj8x357n7vray4v4zupj6xjt",
  //   chainRegistry,
  //   "test"
  // );
  // if (!grantList) return;

  // await sgDelegateFromAll2(grantList, chainRegistry, "test", 8_959_812);

  const poolsAndUsers = await cwQueryPoolsAndUsers();
  const chainRegistry: ChainRegistryStorage = await req.get(
    API_ROUTES.getChainRegistry
  );
  const res = await _updatePoolsAndUsers(
    chainRegistry,
    poolsAndUsers,
    E.CHAIN_TYPE
  );
  // if (!res) return;
  // const { pools, users } = res;
  // await cwUpdatePoolsAndUsers(pools, users);

  // await cwSwap();
  // await cwTransfer();

  // setInterval(async () => {
  //   const poolsAndUsers = await cwQueryPoolsAndUsers();
  //   const chainRegistry: ChainRegistryStorage = await req.get(
  //     API_ROUTES.getChainRegistry
  //   );
  //   const res = await _updatePoolsAndUsers(
  //     chainRegistry,
  //     poolsAndUsers,
  //     E.CHAIN_TYPE
  //   );
  //   if (!res) return;
  //   const { pools, users } = res;
  //   await cwUpdatePoolsAndUsers(pools, users);

  //   await cwSwap();
  //   await cwTransfer();
  //   // await sgDelegateFromAll(poolsAndUsers.users);
  // }, 30_000);
}

async function initStorages() {
  try {
    const t = Date.now();
    const res = await req.get(API_ROUTES.updateAll);
    const delta = (Date.now() - t) / 1e3;
    const minutes = Math.floor(delta / 60);
    const seconds = Math.floor(delta % 60);
    l("\n", res, "\n");
    l("\n", `${minutes} minutes ${seconds} seconds`, "\n");
  } catch (error) {
    l(error);
  }
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
    await process();

    // TODO: fix multiple terra chains bug
    //  await initStorages();
    // setInterval(initStorages, 15 * 60 * 1000);
  });
