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
const express_1 = __importDefault(require("express"));
const utils_1 = require("../common/utils");
const body_parser_1 = require("body-parser");
const cors_1 = __importDefault(require("cors"));
const config_1 = __importDefault(require("./config"));
const utils_2 = require("../common/utils");
const testnet_backend_workers_1 = require("../common/workers/testnet-backend-workers");
function process() {
    return __awaiter(this, void 0, void 0, function* () {
        const { cwSwap, cwTransfer, cwMockUpdatePoolsAndUsers, cwQueryPoolsAndUsers, sgDelegateFromAll, } = yield (0, testnet_backend_workers_1.init)();
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            let poolsAndUsers = yield cwQueryPoolsAndUsers();
            yield sgDelegateFromAll(poolsAndUsers.users);
            yield cwMockUpdatePoolsAndUsers(poolsAndUsers);
            yield cwSwap();
            yield cwTransfer();
        }), 30000);
    });
}
(0, express_1.default)()
    .use((0, cors_1.default)(), (0, body_parser_1.text)(), (0, body_parser_1.json)())
    .use(express_1.default.static((0, utils_2.rootPath)("./dist/frontend")))
    .listen(config_1.default.PORT, () => {
    (0, utils_1.l)(`Ready on port ${config_1.default.PORT}`);
    process();
});
