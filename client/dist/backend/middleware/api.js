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
exports.getAll = exports.updateAll = exports.filterChainRegistry = exports.getPoolsAndUsers = exports.updatePoolsAndUsers = exports.getUserFunds = exports.updateUserFunds = exports.getValidators = exports.updateValidators = exports.getPools = exports.updatePools = exports.getIbcChannnels = exports.updateIbcChannels = exports.getChainRegistry = exports.updateChainRegistry = void 0;
const testnet_backend_workers_1 = require("../account/testnet-backend-workers");
const utils_1 = require("../../common/utils");
const storages_1 = require("../storages");
const envs_1 = require("../envs"); // TODO: change on mainnet
const helpers_1 = require("../helpers");
const allowList = [
    ["secret", "test", ["https://rpc.pulsar.scrttestnet.com/"]],
];
const ignoreList = [];
// client specific storages
const chainRegistryStorage = new storages_1.Storage("chain-registry-storage");
const ibcChannelsStorage = new storages_1.Storage("ibc-channels-storage");
const poolsStorage = new storages_1.Storage("pools-storage");
const validatorsStorage = new storages_1.Storage("validators-storage");
const userFundsStorage = new storages_1.Storage("user-funds-storage");
// contract specific storage
const poolsAndUsersStorage = new storages_1.Storage("pools-and-users-storage");
function updateChainRegistry() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = (0, helpers_1.mergeChainRegistry)(chainRegistryStorage.get(), yield (0, helpers_1.getChainRegistry)(allowList, ignoreList));
            chainRegistryStorage.set(res);
            chainRegistryStorage.write(res);
            return { fn: "updateChainRegistry", updateStatus: "✔️" };
        }
        catch (error) {
            (0, utils_1.l)(error);
            return { fn: "updateChainRegistry", updateStatus: "❌" };
        }
    });
}
exports.updateChainRegistry = updateChainRegistry;
function getChainRegistry() {
    return __awaiter(this, void 0, void 0, function* () {
        const { chainRegistry } = (0, helpers_1.filterChainRegistry)(chainRegistryStorage.get(), ibcChannelsStorage.get(), poolsStorage.get(), validatorsStorage.get(), envs_1.CHAIN_TYPE);
        return chainRegistry;
    });
}
exports.getChainRegistry = getChainRegistry;
function updateIbcChannels() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = (0, helpers_1.mergeIbcChannels)(ibcChannelsStorage.get(), yield (0, helpers_1.getIbcChannnels)(chainRegistryStorage.get(), envs_1.CHAIN_TYPE));
            if (!res)
                throw new Error("mergeIbcChannels returned undefined!");
            ibcChannelsStorage.set(res);
            ibcChannelsStorage.write(res);
            return { fn: "updateIbcChannels", updateStatus: "✔️" };
        }
        catch (error) {
            (0, utils_1.l)(error);
            return { fn: "updateIbcChannels", updateStatus: "❌" };
        }
    });
}
exports.updateIbcChannels = updateIbcChannels;
function getIbcChannnels() {
    return __awaiter(this, void 0, void 0, function* () {
        const { ibcChannels } = (0, helpers_1.filterChainRegistry)(chainRegistryStorage.get(), ibcChannelsStorage.get(), poolsStorage.get(), validatorsStorage.get(), envs_1.CHAIN_TYPE);
        return ibcChannels;
    });
}
exports.getIbcChannnels = getIbcChannnels;
function updatePools() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = (0, helpers_1.mergePools)(poolsStorage.get(), yield (0, helpers_1.getPools)());
            poolsStorage.set(res);
            poolsStorage.write(res);
            return { fn: "updatePools", updateStatus: "✔️" };
        }
        catch (error) {
            (0, utils_1.l)(error);
            return { fn: "updatePools", updateStatus: "❌" };
        }
    });
}
exports.updatePools = updatePools;
function getPools() {
    return __awaiter(this, void 0, void 0, function* () {
        const { pools } = (0, helpers_1.filterChainRegistry)(chainRegistryStorage.get(), ibcChannelsStorage.get(), poolsStorage.get(), validatorsStorage.get(), envs_1.CHAIN_TYPE);
        return pools;
    });
}
exports.getPools = getPools;
function updateValidators() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield (0, helpers_1.getValidators)((0, helpers_1.getChainNameAndRestList)(chainRegistryStorage.get(), envs_1.CHAIN_TYPE));
            if (!res.length)
                throw new Error("_getValidators returned empty list");
            validatorsStorage.set(res);
            validatorsStorage.write(res);
            return { fn: "updateValidators", updateStatus: "✔️" };
        }
        catch (error) {
            (0, utils_1.l)(error);
            return { fn: "updateValidators", updateStatus: "❌" };
        }
    });
}
exports.updateValidators = updateValidators;
function getValidators() {
    return __awaiter(this, void 0, void 0, function* () {
        return validatorsStorage.get();
    });
}
exports.getValidators = getValidators;
// transforms contract response to all users address-balance list
function updateUserFunds() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = (yield (0, helpers_1.getUserFunds)(chainRegistryStorage.get(), poolsAndUsersStorage.get(), poolsStorage.get(), envs_1.CHAIN_TYPE)).map(({ address, holded, staked }) => [address, { holded, staked }]);
            userFundsStorage.set(res);
            userFundsStorage.write(res);
            return { fn: "updateUserFunds", updateStatus: "✔️" };
        }
        catch (error) {
            (0, utils_1.l)(error);
            return { fn: "updateUserFunds", updateStatus: "❌" };
        }
    });
}
exports.updateUserFunds = updateUserFunds;
// filters all users address-balance list by specified user osmo address
function getUserFunds(userOsmoAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        const poolsAndUsers = poolsAndUsersStorage.get();
        if (!poolsAndUsers)
            return [];
        const userAssets = poolsAndUsers.users.find(({ osmo_address }) => osmo_address === userOsmoAddress);
        if (!userAssets)
            return [];
        const addressList = userAssets.asset_list.map(({ wallet_address }) => wallet_address);
        const userFunds = userFundsStorage.get();
        if (!userFunds)
            return [];
        return userFunds.filter(([address]) => addressList.includes(address));
    });
}
exports.getUserFunds = getUserFunds;
function updatePoolsAndUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const helpers = yield (0, testnet_backend_workers_1.init)();
            if (!helpers)
                throw new Error("Init is failed!");
            const { cwQueryPoolsAndUsers } = helpers;
            const res = yield cwQueryPoolsAndUsers();
            poolsAndUsersStorage.set(res);
            poolsAndUsersStorage.write(res);
            return { fn: "updatePoolsAndUsers", updateStatus: "✔️" };
        }
        catch (error) {
            (0, utils_1.l)(error);
            return { fn: "updatePoolsAndUsers", updateStatus: "❌" };
        }
    });
}
exports.updatePoolsAndUsers = updatePoolsAndUsers;
function getPoolsAndUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        return poolsAndUsersStorage.get();
    });
}
exports.getPoolsAndUsers = getPoolsAndUsers;
function filterChainRegistry() {
    return __awaiter(this, void 0, void 0, function* () {
        return (0, helpers_1.filterChainRegistry)(chainRegistryStorage.get(), ibcChannelsStorage.get(), poolsStorage.get(), validatorsStorage.get(), envs_1.CHAIN_TYPE);
    });
}
exports.filterChainRegistry = filterChainRegistry;
function updateAll() {
    return __awaiter(this, void 0, void 0, function* () {
        // request contract data
        const resCw = yield updatePoolsAndUsers();
        // process it and request data from other sources
        const resChainRegistry = yield updateChainRegistry();
        const res = yield Promise.all([
            updateIbcChannels(),
            updatePools(),
            updateValidators(),
            updateUserFunds(),
        ]);
        return [resCw, resChainRegistry, ...res];
    });
}
exports.updateAll = updateAll;
function getAll(userOsmoAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        const { activeNetworks, chainRegistry, ibcChannels, pools } = (0, helpers_1.filterChainRegistry)(chainRegistryStorage.get(), ibcChannelsStorage.get(), poolsStorage.get(), validatorsStorage.get(), envs_1.CHAIN_TYPE);
        const userFunds = userOsmoAddress ? yield getUserFunds(userOsmoAddress) : [];
        return {
            activeNetworks,
            chainRegistry,
            ibcChannels,
            pools,
            validatorsStorage: validatorsStorage.get(),
            userFunds,
        };
    });
}
exports.getAll = getAll;
