import express from "express";
import https from "https";
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
import { readFileSync } from "fs";
import "./services/ssl-fix";
import rateLimit from "express-rate-limit";
import * as h from "helmet";
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

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => res.send("Request rate is limited"),
});

const staticHandler = express.static(rootPath("./dist/frontend"));

const app = express();
app
  .disable("x-powered-by")
  .use(
    // h.contentSecurityPolicy(),
    h.crossOriginEmbedderPolicy({ policy: "credentialless" }),
    h.crossOriginOpenerPolicy(),
    h.crossOriginResourcePolicy(),
    h.dnsPrefetchControl(),
    h.expectCt(),
    h.frameguard(),
    h.hidePoweredBy(),
    h.hsts(),
    h.ieNoOpen(),
    h.noSniff(),
    // h.originAgentCluster(),
    h.permittedCrossDomainPolicies(),
    h.referrerPolicy(),
    h.xssFilter(),
    limiter,
    cors(),
    text(),
    json()
  )
  .use(staticHandler)
  .use("/api", api)
  .use("/key", key)
  .use("/*", staticHandler);

https
  .createServer(
    {
      key: readFileSync(E.SSL_KEY_PATH),
      cert: readFileSync(E.SSL_CERT_PATH),
    },
    app
  )
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
