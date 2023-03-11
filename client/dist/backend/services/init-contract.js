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
const utils_1 = require("../../common/utils");
const envs_1 = require("../envs");
const utils_2 = require("../../common/utils");
const signers_1 = require("../../common/signers");
const testnet_backend_workers_1 = require("../../common/workers/testnet-backend-workers");
const api_1 = require("../routes/api");
const key_1 = require("../middleware/key");
const testnet_config_json_1 = require("../../common/config/testnet-config.json");
const api_helpers_1 = require("../../common/helpers/api-helpers");
const req = (0, utils_1.createRequest)({ baseURL: envs_1.BASE_URL + "/api" });
function initContract() {
    return __awaiter(this, void 0, void 0, function* () {
        const encryptionKey = (0, key_1.getEncryptionKey)();
        if (!encryptionKey)
            return;
        const seed = (0, utils_2.decrypt)(testnet_config_json_1.SEED_DAPP, encryptionKey);
        if (!seed)
            return;
        const { cwQueryPoolsAndUsers, cwUpdatePoolsAndUsers, cwUpdateConfig } = yield (0, testnet_backend_workers_1.init)(seed);
        // add dapp addresses
        const poolsStorage = yield req.get(api_1.ROUTES.getPools);
        const chainRegistry = yield req.get(api_1.ROUTES.getChainRegistry);
        const chain = chainRegistry.find((item) => item.denomNative === "uosmo");
        if (!chain)
            return;
        const gasPrice = (0, signers_1.getGasPriceFromChainRegistryItem)(chain, envs_1.CHAIN_TYPE);
        // @ts-ignore
        const dappAddressAndDenomList = getDappAddressAndDenomList(envs_1.DAPP_ADDRESS, chainRegistry);
        yield cwUpdateConfig({
            dappAddressAndDenomList,
        }, gasPrice);
        // add pools
        const poolsAndUsers = yield cwQueryPoolsAndUsers();
        const res = yield (0, api_helpers_1.updatePoolsAndUsers)(chainRegistry, poolsAndUsers, poolsStorage, envs_1.CHAIN_TYPE);
        if (!res)
            return;
        const { pools, users } = res;
        yield cwUpdatePoolsAndUsers(pools, users, gasPrice);
    });
}
initContract();
