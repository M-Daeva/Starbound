import express from "express";
import { l } from "../common/utils";
import { text, json } from "body-parser";
import cors from "cors";
import { rootPath, decrypt } from "../common/utils";
import { getGasPriceFromChainRegistryItem } from "../common/signers";
import { init } from "../common/workers/testnet-backend-workers";
import { api } from "./routes/api";
import { key } from "./routes/key";
import { getEncryptionKey } from "./middleware/key";
import { SEED_DAPP } from "../common/config/testnet-config.json";
import rateLimit from "express-rate-limit";
import * as h from "helmet";
import { CHAIN_TYPE, DAPP_ADDRESS, PORT } from "./envs";
import {
  updatePoolsAndUsers as _updatePoolsAndUsers,
  _getAllGrants,
} from "../common/helpers/api-helpers";
import {
  updatePools,
  updatePoolsAndUsers,
  updateUserFunds,
  updateChainRegistry,
  updateIbcChannels,
  updateValidators,
  getChainRegistry,
  getPools,
} from "./middleware/api";

async function updateTimeSensitiveStorages() {
  await Promise.all([updatePools(), updatePoolsAndUsers()]);
  await updateUserFunds();
}

async function updateTimeInsensitiveStorages() {
  l(await updateChainRegistry());
  l(await updateIbcChannels());
  l(await updateValidators());
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

  const chainRegistry = await getChainRegistry();

  const chain = chainRegistry.find((item) => item.denomNative === "uosmo");
  if (!chain) return;

  const gasPrice = getGasPriceFromChainRegistryItem(chain, CHAIN_TYPE);

  const poolsStorage = await getPools();
  const poolsAndUsers = await cwQueryPoolsAndUsers();

  // const grants = await _getAllGrants(
  //   DAPP_ADDRESS,
  //   chainRegistry,
  //   CHAIN_TYPE
  // );
  // if (!grants) return;
  // l(grants[0]);

  // await sgDelegateFromAll(grants, chainRegistry, CHAIN_TYPE);
  //return;

  const res = await _updatePoolsAndUsers(
    chainRegistry,
    poolsAndUsers,
    poolsStorage,
    CHAIN_TYPE
  );
  if (!res) return;

  const { pools, users } = res;
  await cwUpdatePoolsAndUsers(pools, users, gasPrice);

  await cwSwap(gasPrice);
  // TODO: check if failing of ibc transfer doesn't affect on next distribution
  // consider execution in a loop
  await cwTransfer(gasPrice);

  setTimeout(async () => {
    const grants = await _getAllGrants(DAPP_ADDRESS, chainRegistry, CHAIN_TYPE);
    if (!grants) return;
    l(grants);

    await sgDelegateFromAll(grants, chainRegistry, CHAIN_TYPE);
  }, 15 * 60 * 1000);
}

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 20 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => res.send("Request rate is limited"),
});

const staticHandler = express.static(rootPath("./dist/frontend"));

express()
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
  .use("/*", staticHandler)
  .listen(PORT, async () => {
    l(`Ready on port ${PORT}`);
    // await triggerContract();
    // setInterval(triggerContract, 24 * 60 * 60 * 1000); // 24 h update period

    const periodSensitive = 15 * 1000; // 15 s update period
    const periodInsensitive = 30 * 60 * 1000; // TODO: set 6 h update period
    let cnt = periodInsensitive / periodSensitive;

    setInterval(async () => {
      await updateTimeSensitiveStorages();
      if (!--cnt) {
        cnt = periodInsensitive / periodSensitive;
        await updateTimeInsensitiveStorages();
      }
    }, periodSensitive);
  });
