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
exports.setEncryptionKey = exports.getEncryptionKey = void 0;
const storages_1 = require("../storages");
const utils_1 = require("../../common/utils");
const signers_1 = require("../../common/signers");
const testnet_config_json_1 = require("../../common/config/testnet-config.json");
const config_1 = __importDefault(require("../config"));
let _encryptionKeyStorage = (0, storages_1.initStorage)("encryption-key-storage");
function getEncryptionKey() {
    return _encryptionKeyStorage.get();
}
exports.getEncryptionKey = getEncryptionKey;
function setEncryptionKey(value) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // skip if key specified
            if (_encryptionKeyStorage.get()) {
                throw new Error(`Key is already specified!`);
            }
            // skip if key is wrong
            const seed = (0, utils_1.decrypt)(testnet_config_json_1.SEED_DAPP, value);
            if (!seed)
                throw new Error(`Key '${value}' is wrong!`);
            const { owner } = yield (0, signers_1.getSgClient)({
                prefix: "osmo",
                RPC: "https://rpc.osmosis.zone:443",
                seed,
            });
            if (owner !== config_1.default.DAPP_ADDRESS)
                throw new Error(`Key '${value}' is wrong!`);
            _encryptionKeyStorage.set(value);
            return "Success!";
        }
        catch (error) {
            return `${error}`;
        }
    });
}
exports.setEncryptionKey = setEncryptionKey;
