import dotenv from "dotenv";
import { rootPath } from "../common/utils";
import fs from "fs";

const envPath = rootPath("./config.env");

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
const e = process.env as { [key: string]: string };

export const IS_PRODUCTION = e.IS_PRODUCTION === "true",
  PATH_TO_STATIC = e.PATH_TO_STATIC_FROM_ROOT_DIR,
  PORT = e.PORT,
  BASE_URL = {
    DEV: `${e.BASE_URL_DEV}:${e.PORT}`,
    PROD: e.BASE_URL_PROD,
    PROXY: e.BASE_URL_PROXY,
  },
  CHAIN_TYPE = e.CHAIN_TYPE as "main" | "test",
  DAPP_ADDRESS = e.DAPP_ADDRESS;
