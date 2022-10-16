import dotenv from "dotenv";
import { rootPath } from "../helpers";
import fs from "fs";
import { l } from "../utils";

const envPath = rootPath("./config.env");

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
const e = process.env as { [key: string]: string };

let envs = {
  SEED: {
    MAIN: e.MAIN_SEED,
    USER: e.USER_SEED,
    MY: e.MY_SEED,
  },
  PORT: e.PORT,
  PATH: {
    TO_STATIC: e.PATH_TO_STATIC_FROM_ROOT_DIR,
  },
  BASE_URL: e.BASE_URL_PROD,
};

if (e.NODE_ENV === "development") {
  envs.BASE_URL = e.BASE_URL_DEV;
}

export default envs;
