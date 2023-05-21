"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../common/utils");
const promises_1 = require("fs/promises");
const promises_2 = __importDefault(require("readline/promises"));
const envs_1 = require("../envs");
const isProduction = (0, utils_1.getLast)(process.argv).trim() === "production";
const baseURL = isProduction ? envs_1.BASE_URL.PROXY : envs_1.BASE_URL.DEV;
const req = new utils_1.Request({ baseURL: baseURL + "/key" });
function initKey() {
    return __awaiter(this, void 0, void 0, function* () {
        let encryptionKey = "";
        try {
            yield (0, promises_1.access)(envs_1.PATH_TO_ENCRYPTION_KEY);
            encryptionKey = yield (0, promises_1.readFile)(envs_1.PATH_TO_ENCRYPTION_KEY, {
                encoding: "utf-8",
            });
        }
        catch (error) {
            const inquirer = promises_2.default.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            encryptionKey = yield inquirer.question("Enter encryption key\n");
            inquirer.close();
        }
        try {
            const res = yield req.post("/set", { encryptionKey });
            (0, utils_1.l)(res);
        }
        catch (error) {
            (0, utils_1.l)(error);
        }
    });
}
initKey();
