import express from "express";
import { l, calcTimeDelta } from "../common/utils";
import { text, json } from "body-parser";
import cors from "cors";
import { rootPath, decrypt } from "../common/utils";
import { TimeInHoursAndMins } from "../common/interfaces";
import { getGasPriceFromChainRegistryItem } from "../common/account/clients";
import { init } from "./account/testnet-backend-workers";
import { api } from "./routes/api";
import { key } from "./routes/key";
import { getEncryptionKey } from "./middleware/key";
import { SEED_DAPP } from "../common/config/osmosis-testnet-config.json";
import rateLimit from "express-rate-limit";
import { readFile, access } from "fs/promises";
import * as h from "helmet";
import { setEncryptionKey } from "./middleware/key";
import { CHAIN_TYPE, DAPP_ADDRESS, PORT, PATH, BASE_URL } from "./envs";
import {
  updatePoolsAndUsers as _updatePoolsAndUsers,
  _getAllGrants,
} from "./helpers";
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

  const helpers = await init(seed);
  if (!helpers) return;

  const {
    owner,
    cwSwap,
    cwTransfer,
    cwQueryPoolsAndUsers,
    sgDelegateFromAll,
    cwUpdatePoolsAndUsers,
  } = helpers;
  if (!owner) return;

  const chainRegistry = await getChainRegistry();

  const chain = chainRegistry.find((item) => item.denomNative === "uosmo");
  if (!chain) return;

  const gasPrice = getGasPriceFromChainRegistryItem(chain, CHAIN_TYPE);

  const poolsStorage = await getPools();
  const poolsAndUsers = await cwQueryPoolsAndUsers();

  // const grants = await _getAllGrants(DAPP_ADDRESS, chainRegistry, CHAIN_TYPE);
  // if (!grants) return;
  // for (const item of grants) l(item);

  // await sgDelegateFromAll(grants, chainRegistry, CHAIN_TYPE);
  // return;

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

async function setKey() {
  try {
    await access(PATH.TO_ENCRYPTION_KEY);
    const encryptionKey = await readFile(PATH.TO_ENCRYPTION_KEY, {
      encoding: "utf-8",
    });
    const res = await setEncryptionKey(encryptionKey);
    l(res);
  } catch (error) {
    l("⚠️ Encryption key is not found!\n");
  }
}

function process() {
  const periodDebounce = 60_000;

  const periodSensitive = 10_000;

  const startTimeInsensitive: TimeInHoursAndMins = { hours: 17, minutes: 45 };
  const periodInsensitive: TimeInHoursAndMins = { hours: 0, minutes: 30 };

  const startTimeContract: TimeInHoursAndMins = { hours: 18, minutes: 0 };
  const periodContract: TimeInHoursAndMins = { hours: 0, minutes: 30 };

  // updating time sensitive storages scheduler
  setInterval(updateTimeSensitiveStorages, periodSensitive);

  // updating time insensitive storages scheduler
  let isStoragesInteractionAllowed = true;

  setInterval(async () => {
    if (!isStoragesInteractionAllowed) return;

    const { hours, minutes } = calcTimeDelta(
      startTimeInsensitive,
      periodInsensitive
    );

    if (!hours && !minutes) {
      isStoragesInteractionAllowed = false;
      await updateTimeInsensitiveStorages();
      setTimeout(() => {
        isStoragesInteractionAllowed = true;
      }, periodDebounce);
    }
  }, 60_000);

  // triggerring contract scheduler
  let isContractInteractionAllowed = true;

  setInterval(async () => {
    if (!isContractInteractionAllowed) return;

    const { hours, minutes } = calcTimeDelta(startTimeContract, periodContract);

    if (!hours && !minutes) {
      isContractInteractionAllowed = false;
      await triggerContract();
      setTimeout(() => {
        isContractInteractionAllowed = true;
      }, periodDebounce);
    }
  }, 5_000);
}

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (_req, res) => res.send("Request rate is limited"),
});

const staticHandler = express.static(rootPath("./dist/frontend"));

// TODO: check helmet updates
express()
  .disable("x-powered-by")
  .use(
    // h.contentSecurityPolicy(),
    h.crossOriginEmbedderPolicy({ policy: "credentialless" }),
    h.crossOriginOpenerPolicy(),
    h.crossOriginResourcePolicy(),
    h.dnsPrefetchControl(),
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
    l(`\n✔️ Server is running on ${BASE_URL.DEV}`);
    await setKey(); // set encryption key in dev mode if it can be found

    // process(); // TODO: uncomment before prod
  });
