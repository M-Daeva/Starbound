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
exports.Utils = exports.Collection = exports.Denom = exports.Client = void 0;
const config_1 = __importDefault(require("../config"));
const utils_1 = require("../utils");
const [MAIN_ADDRESS, USER_ADDRESS] = [config_1.default.SEED.MAIN, config_1.default.SEED.USER].map(utils_1.getAddress);
var Denom;
(function (Denom) {
    Denom["STCOIN"] = "axlusdc";
    Denom["COIN"] = "luna";
})(Denom || (Denom = {}));
exports.Denom = Denom;
var Collection;
(function (Collection) {
    Collection["GALACTIC_PUNKS"] = "GalacticPunks";
})(Collection || (Collection = {}));
exports.Collection = Collection;
let wallets = [
    {
        address: MAIN_ADDRESS,
        balance: [
            { denom: Denom.STCOIN, value: 1e6 },
            { denom: Denom.COIN, value: 1e6 },
        ],
        nft: [],
    },
    {
        address: USER_ADDRESS,
        balance: [{ denom: Denom.STCOIN, value: 1e3 }],
        nft: [{ collection: Collection.GALACTIC_PUNKS, id: 1000 }],
    },
];
class Client {
    constructor(seed) {
        let address = (0, utils_1.getAddress)(seed);
        if (Client.isAdressUsed(address)) {
            this.wallet = wallets.filter((item) => item.address === address)[0];
        }
        else {
            this.wallet = {
                address,
                balance: [],
                nft: [],
            };
            wallets.push(this.wallet);
        }
    }
    static isAdressUsed(address) {
        return wallets.map((item) => item.address).includes(address);
    }
    static getWallet(address) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Client.isAdressUsed(address)) {
                return {
                    address,
                    balance: [],
                    nft: [],
                };
            }
            return wallets.filter((item) => item.address === address)[0];
        });
    }
    static getBalance(address, token) {
        return __awaiter(this, void 0, void 0, function* () {
            let wallet = yield Client.getWallet(address);
            if (!wallet.balance.map((item) => item.denom).includes(token)) {
                return 0;
            }
            return wallet.balance.filter((item) => item.denom === token)[0].value;
        });
    }
    updateBalance(address, token, value) {
        return __awaiter(this, void 0, void 0, function* () {
            let wallet = yield Client.getWallet(address);
            if (wallet.balance.filter((item) => item.denom === token).length === 0) {
                wallet.balance = [...wallet.balance, { denom: token, value }];
            }
            else {
                wallet.balance = wallet.balance.map((item) => {
                    if (item.denom === token)
                        item.value += value;
                    return item;
                });
            }
        });
    }
    sendToken(address, token, value) {
        return __awaiter(this, void 0, void 0, function* () {
            let balance = yield Client.getBalance(this.wallet.address, token);
            if (value > balance) {
                throw new Error("insufficient balance!");
            }
            this.updateBalance(this.wallet.address, token, -value);
            this.updateBalance(address, token, value);
        });
    }
}
exports.Client = Client;
var Utils;
(function (Utils) {
    function getQuantityByDenom(balance, denom) {
        return balance.filter(({ denom }) => denom === denom)[0].value;
    }
    Utils.getQuantityByDenom = getQuantityByDenom;
})(Utils || (Utils = {}));
exports.Utils = Utils;
