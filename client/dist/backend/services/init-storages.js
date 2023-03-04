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
const api_1 = require("../routes/api");
require("./ssl-fix");
const req = (0, utils_1.createRequest)({ baseURL: config_1.default.BASE_URL + "/api" });
function initStorages() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const t = Date.now();
            const res = yield req.get(api_1.ROUTES.updateAll);
            const delta = (Date.now() - t) / 1e3;
            const minutes = Math.floor(delta / 60);
            const seconds = Math.floor(delta % 60);
            (0, utils_1.l)("\n", res, "\n");
            (0, utils_1.l)("\n", `${minutes} minutes ${seconds} seconds`, "\n");
        }
        catch (error) {
            (0, utils_1.l)(error);
        }
    });
}
initStorages();
