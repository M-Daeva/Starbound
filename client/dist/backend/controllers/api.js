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
const api_1 = require("../middleware/api");
function updateChainRegistry(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, api_1.updateChainRegistry)();
        res.send(data);
    });
}
exports.updateChainRegistry = updateChainRegistry;
function getChainRegistry(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, api_1.getChainRegistry)();
        res.send(data);
    });
}
exports.getChainRegistry = getChainRegistry;
function updateIbcChannels(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, api_1.updateIbcChannels)();
        res.send(data);
    });
}
exports.updateIbcChannels = updateIbcChannels;
function getIbcChannnels(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, api_1.getIbcChannnels)();
        res.send(data);
    });
}
exports.getIbcChannnels = getIbcChannnels;
function updatePools(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, api_1.updatePools)();
        res.send(data);
    });
}
exports.updatePools = updatePools;
function getPools(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, api_1.getPools)();
        res.send(data);
    });
}
exports.getPools = getPools;
function updateValidators(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, api_1.updateValidators)();
        res.send(data);
    });
}
exports.updateValidators = updateValidators;
function getValidators(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, api_1.getValidators)();
        res.send(data);
    });
}
exports.getValidators = getValidators;
function updateUserFunds(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, api_1.updateUserFunds)();
        res.send(data);
    });
}
exports.updateUserFunds = updateUserFunds;
function getUserFunds(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userOsmoAddress } = req.query;
        if (!userOsmoAddress)
            return;
        const data = yield (0, api_1.getUserFunds)(userOsmoAddress);
        res.send(data);
    });
}
exports.getUserFunds = getUserFunds;
function updatePoolsAndUsers(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, api_1.updatePoolsAndUsers)();
        res.send(data);
    });
}
exports.updatePoolsAndUsers = updatePoolsAndUsers;
function getPoolsAndUsers(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, api_1.getPoolsAndUsers)();
        res.send(data);
    });
}
exports.getPoolsAndUsers = getPoolsAndUsers;
function filterChainRegistry(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, api_1.filterChainRegistry)();
        res.send(data);
    });
}
exports.filterChainRegistry = filterChainRegistry;
function updateAll(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, api_1.updateAll)();
        res.send(data);
    });
}
exports.updateAll = updateAll;
// userOsmoAddress presence is not required to get other data
// comparing to getUserFunds()
function getAll(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userOsmoAddress } = req.query;
        const data = yield (0, api_1.getAll)(userOsmoAddress);
        res.send(data);
    });
}
exports.getAll = getAll;
