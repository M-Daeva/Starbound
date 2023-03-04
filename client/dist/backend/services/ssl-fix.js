"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = __importDefault(require("https"));
const config_1 = __importDefault(require("../config"));
// "Error: self-signed certificate" fix
// https://github.com/axios/axios/issues/535#issuecomment-599971219
exports.default = (() => {
    if (!config_1.default.IS_PRODUCTION) {
        https_1.default.globalAgent.options.rejectUnauthorized = false;
    }
})();
