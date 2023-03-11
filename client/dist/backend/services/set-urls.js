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
const promises_1 = require("fs/promises");
const envs_1 = require("../envs");
const utils_1 = require("../../common/utils");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const configFilePath = (0, utils_1.rootPath)("./src/frontend/src/config/index.ts");
        yield (0, promises_1.access)(configFilePath);
        let configFile = yield (0, promises_1.readFile)(configFilePath, { encoding: "utf-8" });
        configFile = configFile
            .replace(/const devUrl = "[^"]*";/, `const devUrl = "${envs_1.BASE_URL.DEV}";`)
            .replace(/const prodUrl = "[^"]*";/, `const prodUrl = "${envs_1.BASE_URL.PROXY}";`);
        yield (0, promises_1.writeFile)(configFilePath, configFile);
    });
}
main();
