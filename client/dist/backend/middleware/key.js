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
exports.setEncryptionKey = exports.getEncryptionKey = void 0;
const storages_1 = require("../storages");
const utils_1 = require("../../common/utils");
const signer_1 = require("../account/signer");
const osmosis_testnet_config_json_1 = require("../../common/config/osmosis-testnet-config.json");
const envs_1 = require("../envs");
const RPC = "https://rpc.osmosis.zone:443";
const prefix = "osmo";
const encryptionKeyStorage = new storages_1.Storage("encryption-key-storage");
function getEncryptionKey() {
    return encryptionKeyStorage.get();
}
exports.getEncryptionKey = getEncryptionKey;
function setEncryptionKey(value) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // skip if key specified
            if (encryptionKeyStorage.get()) {
                throw new Error(`⚠️ Encryption key is already specified!`);
            }
            // skip if key is wrong
            const seed = (0, utils_1.decrypt)(osmosis_testnet_config_json_1.SEED_DAPP, value);
            if (!seed) {
                throw new Error(`❌ Encryption key '${value}' is wrong!`);
            }
            const { owner } = yield (0, signer_1.getSigner)(RPC, prefix, seed);
            if (owner !== envs_1.DAPP_ADDRESS) {
                throw new Error(`❌ Encryption key '${value}' is wrong!`);
            }
            encryptionKeyStorage.set(value);
            return "✔️ Encryption key is loaded!\n";
        }
        catch (error) {
            return `${error}`.split("Error: ")[1];
        }
    });
}
exports.setEncryptionKey = setEncryptionKey;
