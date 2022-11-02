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
exports.checkMainBalance = void 0;
const fakeSDK_1 = require("../services/fakeSDK");
const config_1 = __importDefault(require("../config"));
const [myClient, userClient, mainClient] = [
    config_1.default.SEED.MY,
    config_1.default.SEED.USER,
    config_1.default.SEED.MAIN,
].map((item) => new fakeSDK_1.Client(item));
function sendFromUserToMain(token, quantity) {
    return __awaiter(this, void 0, void 0, function* () {
        yield userClient.sendToken(myClient.wallet.address, token, quantity);
    });
}
function checkMainBalance() {
    return mainClient.wallet.balance;
}
exports.checkMainBalance = checkMainBalance;
