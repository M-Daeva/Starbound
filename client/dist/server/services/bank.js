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
const fakeSDK_1 = require("./fakeSDK");
const timer_1 = __importDefault(require("./timer"));
const utils_1 = require("../utils");
class Bank {
    constructor(seed) {
        this.users = [];
        this.client = new fakeSDK_1.Client(seed);
        this.timer = new timer_1.default(1000, this.updateState);
    }
    deposit(userClient, value) {
        return __awaiter(this, void 0, void 0, function* () {
            yield userClient.sendToken(this.wallet.address, fakeSDK_1.Denom.STCOIN, value);
        });
    }
    unbond(userClient, value) { }
    claim(userClient) { }
    provide(userClient) { }
    withdraw(userClient) { }
    borrow(userClient, value) { }
    repay(userClient, value) { }
    // public showBalance(): BalanceItem[] {
    //   return this.client.wallet.balance;
    // }
    get wallet() {
        return this.client.wallet;
    }
    init() {
        this.timer.start();
    }
    collectFloorPrices() {
        return [];
    }
    calculateLTV() {
        return [];
    }
    updateState() {
        //const floorPrices = this.collectFloorPrices();
        // const LTVArr = this.calculateLTV();
        // LTVArr.forEach((element) => {
        //   this.liquidate(element);
        // });
        (0, utils_1.l)(new Date());
    }
    liquidate(LTV) { }
    sendTX() { }
}
exports.default = Bank;
