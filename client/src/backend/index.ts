import express from "express";
import { l, createRequest } from "../common/utils";
import { text, json } from "body-parser";
import cors from "cors";
import E from "./config";
import { rootPath, decrypt } from "../common/utils";
import { getGasPriceFromChainRegistryItem } from "../common/signers";
import { init } from "../common/workers/testnet-backend-workers";
import { api, ROUTES as API_ROUTES } from "./routes/api";
import { key } from "./routes/key";
import { getEncryptionKey } from "./middleware/key";
import { SEED_DAPP } from "../common/config/testnet-config.json";
import {
  ChainRegistryStorage,
  PoolsStorage,
} from "../common/helpers/interfaces";
import {
  updatePoolsAndUsers as _updatePoolsAndUsers,
  _getAllGrants,
} from "../common/helpers/api-helpers";

const req = createRequest({ baseURL: E.BASE_URL + "/api" });

async function updateTimeSensitiveStorages() {
  await Promise.all([
    req.get(API_ROUTES.updatePools),
    req.get(API_ROUTES.updatePoolsAndUsers),
    req.get(API_ROUTES.updateUserFunds),
  ]);
}

async function updateTimeInsensitiveStorages() {
  await Promise.all([
    req.get(API_ROUTES.updateChainRegistry),
    req.get(API_ROUTES.updateIbcChannels),
    req.get(API_ROUTES.updateValidators),
  ]);
}

async function triggerContract() {
  const encryptionKey = getEncryptionKey();
  if (!encryptionKey) return;

  const seed = decrypt(SEED_DAPP, encryptionKey);
  if (!seed) return;

  const {
    cwSwap,
    cwTransfer,
    cwQueryPoolsAndUsers,
    sgDelegateFromAll,
    cwUpdatePoolsAndUsers,
  } = await init(seed);

  const chainRegistry: ChainRegistryStorage = await req.get(
    API_ROUTES.getChainRegistry
  );

  const chain = chainRegistry.find((item) => item.denomNative === "uosmo");
  if (!chain) return;

  const gasPrice = getGasPriceFromChainRegistryItem(chain, E.CHAIN_TYPE);

  const poolsStorage: PoolsStorage = await req.get(API_ROUTES.getPools);
  const poolsAndUsers = await cwQueryPoolsAndUsers();

  // const grants = await _getAllGrants(
  //   E.DAPP_ADDRESS,
  //   chainRegistry,
  //   E.CHAIN_TYPE
  // );
  // if (!grants) return;
  // l(grants[0]);

  // await sgDelegateFromAll(grants, chainRegistry, E.CHAIN_TYPE);
  //return;

  const res = await _updatePoolsAndUsers(
    chainRegistry,
    poolsAndUsers,
    poolsStorage,
    E.CHAIN_TYPE
  );
  if (!res) return;

  const { pools, users } = res;
  await cwUpdatePoolsAndUsers(pools, users, gasPrice);

  await cwSwap(gasPrice);
  // TODO: check if failing of ibc transfer doesn't affect on next distribution
  // consider execution in a loop
  await cwTransfer(gasPrice);

  setTimeout(async () => {
    const grants = await _getAllGrants(
      E.DAPP_ADDRESS,
      chainRegistry,
      E.CHAIN_TYPE
    );
    if (!grants) return;
    l(grants);

    await sgDelegateFromAll(grants, chainRegistry, E.CHAIN_TYPE);
  }, 15 * 60 * 1000);
}

const staticHandler = express.static(rootPath("./dist/frontend"));

express()
  .use(cors(), text(), json())
  .use(staticHandler)
  .use("/api", api)
  .use("/key", key)
  .use("/*", staticHandler)

  .listen(E.PORT, async () => {
    l(`Ready on port ${E.PORT}`);
    // await triggerContract();
    // setInterval(triggerContract, 24 * 60 * 60 * 1000); // 24 h update period

    const periodSensitive = 15 * 1000; // 15 s update period
    const periodInsensitive = 6 * 60 * 60 * 1000; // 6 h update period
    let cnt = periodInsensitive / periodSensitive;

    setInterval(async () => {
      await updateTimeSensitiveStorages();
      if (!--cnt) {
        cnt = periodInsensitive / periodSensitive;
        await updateTimeInsensitiveStorages();
      }
    }, periodSensitive);
  });
