import dotenv from "dotenv";
import { rootPath } from "../common/utils";
import fs from "fs";

const envPath = rootPath("./config.env");

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
const e = process.env as { [key: string]: string };

const IS_PRODUCTION = e.IS_PRODUCTION === "true";

export default {
  IS_PRODUCTION,
  PORT: e.PORT,
  PATH: {
    TO_STATIC: e.PATH_TO_STATIC_FROM_ROOT_DIR,
  },
  BASE_URL: IS_PRODUCTION ? e.BASE_URL_PROD : e.BASE_URL_DEV,
  CHAIN_TYPE: e.CHAIN_TYPE as "main" | "test",
  DAPP_ADDRESS: e.DAPP_ADDRESS,
  SSL_KEY_PATH: IS_PRODUCTION ? "server.key" : "../../.test-wallets/server.key",
  SSL_CERT_PATH: IS_PRODUCTION
    ? "server.cert"
    : "../../.test-wallets/server.cert",
};
