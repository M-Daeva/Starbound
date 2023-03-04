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
function readDecryptWrite(path, key) {
    return __awaiter(this, void 0, void 0, function* () {
        const src = yield (0, promises_1.readFile)((0, utils_1.rootPath)(path), { encoding: "utf-8" });
        const decrypted = (0, utils_1.decrypt)(src, key);
        if (!decrypted)
            return;
        const [prefix, postfix] = path.split(".");
        const [name] = prefix.split("_");
        yield (0, promises_1.writeFile)((0, utils_1.rootPath)(`${name}.${postfix}`), decrypted);
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    const key = (0, utils_1.getLast)(process.argv).trim();
    yield Promise.all(["server_enc.cert", "server_enc.key"].map((item) => readDecryptWrite(item, key)));
}))();
