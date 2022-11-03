"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const helpers_1 = require("../common/helpers");
const fs_1 = __importDefault(require("fs"));
const envPath = (0, helpers_1.rootPath)("./config.env");
if (fs_1.default.existsSync(envPath)) {
    dotenv_1.default.config({ path: envPath });
}
const e = process.env;
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
exports.default = envs;
