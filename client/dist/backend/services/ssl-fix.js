"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = __importDefault(require("https"));
// "Error: self-signed certificate" fix
// https://github.com/axios/axios/issues/535#issuecomment-599971219
exports.default = (() => {
    // if (!E.IS_PRODUCTION) {
    https_1.default.globalAgent.options.rejectUnauthorized = false;
    // }
})();
