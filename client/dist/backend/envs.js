"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAPP_ADDRESS = exports.CHAIN_TYPE = exports.BASE_URL = exports.PORT = exports.PATH_TO_STATIC = exports.IS_PRODUCTION = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const utils_1 = require("../common/utils");
const fs_1 = __importDefault(require("fs"));
const envPath = (0, utils_1.rootPath)("./config.env");
if (fs_1.default.existsSync(envPath)) {
    dotenv_1.default.config({ path: envPath });
}
const e = process.env;
exports.IS_PRODUCTION = e.IS_PRODUCTION === "true", exports.PATH_TO_STATIC = e.PATH_TO_STATIC_FROM_ROOT_DIR, exports.PORT = e.PORT, exports.BASE_URL = {
    DEV: `${e.BASE_URL_DEV}:${e.PORT}`,
    PROD: e.BASE_URL_PROD,
    PROXY: e.BASE_URL_PROXY,
}, exports.CHAIN_TYPE = e.CHAIN_TYPE, exports.DAPP_ADDRESS = e.DAPP_ADDRESS;
