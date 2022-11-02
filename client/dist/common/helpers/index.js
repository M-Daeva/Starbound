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
exports.getSignerFromMnemonic = exports.rootPath = exports.delay = exports.dec = exports.enc = exports.writeFileAsync = exports.readFileAsync = exports.generateKey = void 0;
const simple_crypto_js_1 = require("simple-crypto-js");
const util_1 = require("util");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const proto_signing_1 = require("@cosmjs/proto-signing");
const enc = (text, key) => new simple_crypto_js_1.SimpleCrypto(key).encrypt(text);
exports.enc = enc;
const dec = (code, key) => new simple_crypto_js_1.SimpleCrypto(key).decrypt(code);
exports.dec = dec;
const readFileAsync = (dir) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield (0, util_1.promisify)(fs_1.default.readFile)(dir)).toString();
});
exports.readFileAsync = readFileAsync;
const writeFileAsync = (0, util_1.promisify)(fs_1.default.writeFile);
exports.writeFileAsync = writeFileAsync;
const delay = (0, util_1.promisify)(setTimeout);
exports.delay = delay;
const rootPath = (dir) => path_1.default.resolve(__dirname, "../../../", dir);
exports.rootPath = rootPath;
const generateKey = (dir) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = yield proto_signing_1.DirectSecp256k1HdWallet.generate(24);
    yield writeFileAsync(rootPath(dir), wallet.mnemonic);
    const accounts = yield wallet.getAccounts();
    console.error("Mnemonic with 1st account:", accounts[0].address);
});
exports.generateKey = generateKey;
const getSignerFromMnemonic = () => __awaiter(void 0, void 0, void 0, function* () {
    const seed = yield readFileAsync(rootPath("./keys/user.key"));
    return proto_signing_1.DirectSecp256k1HdWallet.fromMnemonic(seed, { prefix: "cosmos" });
});
exports.getSignerFromMnemonic = getSignerFromMnemonic;
