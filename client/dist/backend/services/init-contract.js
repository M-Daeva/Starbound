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
const envs_1 = require("../envs");
const clients_1 = require("../../common/account/clients");
const testnet_backend_workers_1 = require("../account/testnet-backend-workers");
const osmosis_testnet_config_json_1 = require("../../common/config/osmosis-testnet-config.json");
const helpers_1 = require("../helpers");
const api_1 = require("../middleware/api");
const get_seed_1 = require("./get-seed");
const utils_1 = require("../../common/utils");
function initContract() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const seed = yield (0, get_seed_1.getSeed)(osmosis_testnet_config_json_1.SEED_DAPP);
            if (!seed)
                throw new Error("Seed is not found!");
            const helpers = yield (0, testnet_backend_workers_1.init)();
            if (!helpers)
                return;
            const { owner, cwQueryPoolsAndUsers, cwUpdatePoolsAndUsers, cwUpdateConfig, } = helpers;
            if (!owner)
                return;
            // add dapp addresses
            const poolsStorage = yield (0, api_1.getPools)();
            const chainRegistry = yield (0, api_1.getChainRegistry)();
            const chain = chainRegistry.find((item) => item.denomNative === "uosmo");
            if (!chain)
                return;
            const gasPrice = (0, clients_1.getGasPriceFromChainRegistryItem)(chain, envs_1.CHAIN_TYPE);
            const dappAddressAndDenomList = (0, helpers_1.getDappAddressAndDenomList)(envs_1.DAPP_ADDRESS, chainRegistry); // ts-codegen issue
            yield cwUpdateConfig({
                dappAddressAndDenomList,
            }, gasPrice);
            // add pools
            const poolsAndUsers = yield cwQueryPoolsAndUsers();
            const res = yield (0, helpers_1.updatePoolsAndUsers)(chainRegistry, poolsAndUsers, poolsStorage, envs_1.CHAIN_TYPE);
            if (!res)
                return;
            const { pools, users } = res;
            yield cwUpdatePoolsAndUsers(pools, users, gasPrice);
            (0, utils_1.l)("✔️ The contract was initialized!");
        }
        catch (error) {
            (0, utils_1.l)(error);
        }
    });
}
initContract();
