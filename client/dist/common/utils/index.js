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
exports.trimDecimal = exports.calcTimeDelta = exports.decrypt = exports.encrypt = exports.getChannelId = exports.getIbcDenom = exports.specifyTimeout = exports.getLast = exports.rootPath = exports.r = exports.l = exports.Request = void 0;
const axios_1 = __importDefault(require("axios"));
const path_1 = __importDefault(require("path"));
const crypto_js_1 = require("crypto-js");
const decimal_js_1 = require("decimal.js");
const l = console.log.bind(console);
exports.l = l;
function r(num, digits = 0) {
    let k = Math.pow(10, digits);
    return Math.round(k * num) / k;
}
exports.r = r;
function getLast(arr) {
    return arr[arr.length - 1];
}
exports.getLast = getLast;
function rootPath(dir) {
    return path_1.default.resolve(__dirname, "../../../", dir);
}
exports.rootPath = rootPath;
class Request {
    constructor(config = {}) {
        this.req = axios_1.default.create(config);
    }
    get(url, config) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.req.get(url, config)).data;
        });
    }
    post(url, params, config) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.req.post(url, params, config)).data;
        });
    }
}
exports.Request = Request;
function specifyTimeout(promise, timeout = 5000, exception = () => {
    throw new Error("Timeout!");
}) {
    return __awaiter(this, void 0, void 0, function* () {
        let timer;
        return Promise.race([
            promise,
            new Promise((_r, rej) => (timer = setTimeout(rej, timeout, exception))),
        ]).finally(() => clearTimeout(timer));
    });
}
exports.specifyTimeout = specifyTimeout;
/**
 * Returns destination denom of coin/token on chain A transferred from chain A to chain B, where
 * @param channelId - id of IBC channel from chain B to chain A
 * @param srcDenom - denom of coin/token on chain A
 * @param portId - port id, 'transfer' by default
 * @returns destination denom in form of 'ibc/{hash}'
 */
function getIbcDenom(channelId, srcDenom, portId = "transfer") {
    return ("ibc/" +
        (0, crypto_js_1.SHA256)(`${portId}/${channelId}/${srcDenom}`).toString().toUpperCase());
}
exports.getIbcDenom = getIbcDenom;
/**
 * Returns id of IBC channel from chain B to chain A for coin/token
 * transferred from chain A to chain B, where
 * @param srcDenom - denom of coin/token on chain A
 * @param dstDenom - destination denom of coin/token from chain A on chain B in form of 'ibc/{hash}'
 * @param portId - port id, 'transfer' by default
 * @returns id of IBC channel from chain B to chain A
 */
function getChannelId(srcDenom, dstDenom, portId = "transfer") {
    const maxChannelId = 10000;
    const targetHash = dstDenom.split("/")[1].toLowerCase();
    for (let i = 0; i < maxChannelId; i++) {
        const channelId = `channel-${i}`;
        const hash = (0, crypto_js_1.SHA256)(`${portId}/${channelId}/${srcDenom}`).toString();
        if (hash === targetHash)
            return channelId;
    }
}
exports.getChannelId = getChannelId;
function encrypt(data, key) {
    return crypto_js_1.AES.encrypt(data, key).toString();
}
exports.encrypt = encrypt;
function decrypt(encryptedData, key) {
    // "Malformed UTF-8 data" workaround
    try {
        const bytes = crypto_js_1.AES.decrypt(encryptedData, key);
        return bytes.toString(crypto_js_1.enc.Utf8);
    }
    catch (error) {
        return;
    }
}
exports.decrypt = decrypt;
function _timeToMins(time) {
    const { hours, minutes } = time;
    return 60 * hours + minutes;
}
function _minsToTime(mins) {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return { hours, minutes };
}
function calcTimeDelta(targetTime, period, ignoreRange = []) {
    const targetTimeInMins = _timeToMins(targetTime);
    const currentTime = new Date();
    const currentTimeInMins = _timeToMins({
        hours: currentTime.getHours(),
        minutes: currentTime.getMinutes(),
    });
    const periodInMins = _timeToMins(period);
    let delta = currentTimeInMins - targetTimeInMins;
    if (delta < 0)
        delta += 24 * 60;
    let res = Math.ceil(delta / periodInMins) * periodInMins - delta;
    if (ignoreRange.length) {
        const [ignoreStartInMins, ignoreEndInMins] = ignoreRange.map(_timeToMins);
        if (currentTimeInMins + res >= ignoreStartInMins &&
            currentTimeInMins + res <= ignoreEndInMins) {
            while (currentTimeInMins + res <= ignoreEndInMins) {
                res += periodInMins;
            }
        }
    }
    return _minsToTime(res);
}
exports.calcTimeDelta = calcTimeDelta;
// removes additional digits on display
function trimDecimal(price, err = "0.001") {
    price = price.toString();
    if (!price.includes("."))
        return price;
    const one = new decimal_js_1.Decimal("1");
    const target = one.sub(new decimal_js_1.Decimal(err));
    let priceNext = price;
    let ratio = one;
    while (ratio.greaterThan(target)) {
        price = price.slice(0, price.length - 1);
        priceNext = price.slice(0, price.length - 1);
        ratio = new decimal_js_1.Decimal(priceNext).div(new decimal_js_1.Decimal(price));
    }
    return price.replace(/0/g, "") === "." ? "0" : price;
}
exports.trimDecimal = trimDecimal;
