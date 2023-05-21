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
exports.getSeed = void 0;
const promises_1 = require("fs/promises");
const utils_1 = require("../../common/utils");
function getSeed(seedEncrypted) {
    return __awaiter(this, void 0, void 0, function* () {
        const keyPath = (0, utils_1.rootPath)("../../.test-wallets/key");
        try {
            yield (0, promises_1.access)(keyPath);
            const encryptionKey = yield (0, promises_1.readFile)(keyPath, { encoding: "utf-8" });
            const seed = (0, utils_1.decrypt)(seedEncrypted, encryptionKey);
            if (!seed)
                throw new Error("Can not get seed!");
            return seed;
        }
        catch (error) {
            (0, utils_1.l)(error);
        }
    });
}
exports.getSeed = getSeed;
