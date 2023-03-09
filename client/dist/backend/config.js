"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const utils_1 = require("../common/utils");
const fs_1 = __importDefault(require("fs"));
const envPath = (0, utils_1.rootPath)("./config.env");
if (fs_1.default.existsSync(envPath)) {
    dotenv_1.default.config({ path: envPath });
}
const e = process.env;
const IS_PRODUCTION = e.IS_PRODUCTION === "true";
exports.default = {
    IS_PRODUCTION,
    PORT: e.PORT,
    PATH: {
        TO_STATIC: e.PATH_TO_STATIC_FROM_ROOT_DIR,
    },
    BASE_URL_PROD: e.BASE_URL_PROD,
    BASE_URL_DEV: e.BASE_URL_DEV,
    BASE_URL: IS_PRODUCTION ? e.BASE_URL_PROD : e.BASE_URL_DEV,
    CHAIN_TYPE: e.CHAIN_TYPE,
    DAPP_ADDRESS: e.DAPP_ADDRESS,
    SSL_KEY_PATH: IS_PRODUCTION ? "server.key" : "../../.test-wallets/server.key",
    SSL_CERT_PATH: IS_PRODUCTION
        ? "server.cert"
        : "../../.test-wallets/server.cert",
};
