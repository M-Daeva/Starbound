import express from "express";
import { l, createRequest } from "../common/utils";
import { text, json } from "body-parser";
import cors from "cors";
import E from "./config";
import { rootPath } from "../common/utils";
import { ChainRegistryStorage } from "../common/helpers/interfaces";
import { init } from "../common/workers/testnet-backend-workers";
import dashboard from "./routes/dashboard";
import assets from "./routes/assets";
import bank from "./routes/bank";
import { api, ROUTES as API_ROUTES } from "./routes/api";
import {
  updatePoolsAndUsers as _updatePoolsAndUsers,
  _getAllGrants,
} from "../common/helpers/api-helpers";

let req = createRequest({ baseURL: E.BASE_URL + "/api" });

async function _process() {
  const {
    cwSwap,
    cwTransfer,
    cwQueryPoolsAndUsers,
    sgDelegateFromAll,
    cwUpdatePoolsAndUsers,
  } = await init();

  const chainRegistry: ChainRegistryStorage = await req.get(
    API_ROUTES.getChainRegistry
  );
  const poolsAndUsers = await cwQueryPoolsAndUsers();
  const res = await _updatePoolsAndUsers(
    chainRegistry,
    poolsAndUsers,
    E.CHAIN_TYPE
  );
  if (!res) return;

  const { pools, users } = res;
  await cwUpdatePoolsAndUsers(pools, users);

  await cwSwap();
  await cwTransfer();

  const grants = await _getAllGrants(
    E.DAPP_ADDRESS,
    chainRegistry,
    E.CHAIN_TYPE
  );
  if (!grants) return;

  await sgDelegateFromAll(grants, chainRegistry, E.CHAIN_TYPE);
}

async function process() {
  await _process();
  setInterval(_process, 300_000);
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
    // await process();

    // TODO: split updating api and cw storages
    // await initStorages();
    // setInterval(initStorages, 15 * 60 * 1000);
  });
