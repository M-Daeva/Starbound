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
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../common/utils");
const promises_1 = require("fs/promises");
function readEncryptWrite(path, key) {
    return __awaiter(this, void 0, void 0, function* () {
        const src = yield (0, promises_1.readFile)((0, utils_1.rootPath)(path), { encoding: "utf-8" });
        const encrypted = (0, utils_1.encrypt)(src, key);
        const name = (0, utils_1.getLast)(path.split("/"));
        const [prefix, postfix] = name.split(".");
        yield (0, promises_1.writeFile)((0, utils_1.rootPath)(`${prefix}_enc.${postfix}`), encrypted);
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    const key = (0, utils_1.getLast)(process.argv).trim();
    yield Promise.all(["../../.test-wallets/server.cert", "../../.test-wallets/server.key"].map((item) => readEncryptWrite(item, key)));
}))();
