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
const config_1 = __importDefault(require("../config"));
const promises_1 = require("fs/promises");
const promises_2 = __importDefault(require("readline/promises"));
require("./ssl-fix");
const req = (0, utils_1.createRequest)({ baseURL: config_1.default.BASE_URL + "/key" });
function initKey() {
    return __awaiter(this, void 0, void 0, function* () {
        const keyPath = (0, utils_1.rootPath)("../../.test-wallets/key");
        let encryptionKey = "";
        try {
            yield (0, promises_1.access)(keyPath);
            encryptionKey = yield (0, promises_1.readFile)(keyPath, { encoding: "utf-8" });
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
