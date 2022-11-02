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
exports.getCwHelpers = void 0;
const stargate_1 = require("@cosmjs/stargate");
const utils_1 = require("../utils");
const clients_1 = require("../clients");
const interfaces_1 = require("./interfaces");
function getCwHelpers(clientStruct, contractAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        const { client, owner } = yield (0, clients_1.getCwClient)(clientStruct);
        function _cwGetPools() {
            return __awaiter(this, void 0, void 0, function* () {
                let res = yield client.queryContractSmart(contractAddress, {
                    get_pools: {},
                });
                (0, utils_1.l)("\n", res, "\n");
            });
        }
        function _cwGetPrices() {
            return __awaiter(this, void 0, void 0, function* () {
                let res = yield client.queryContractSmart(contractAddress, {
                    get_prices: {},
                });
                (0, utils_1.l)("\n", res, "\n");
            });
        }
        function _cwGetBankBalance() {
            return __awaiter(this, void 0, void 0, function* () {
                let res = yield client.queryContractSmart(contractAddress, {
                    get_bank_balance: {},
                });
                (0, utils_1.l)("\n", res, "\n");
            });
        }
        function _cwDeposit(tokenAmount) {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield client.execute(owner, contractAddress, { deposit: {} }, clients_1.fee, "", [(0, stargate_1.coin)(tokenAmount, interfaces_1.DENOMS.OSMO)]);
                (0, utils_1.l)({ attributes: res.logs[0].events[2].attributes }, "\n");
            });
        }
        function _cwDebugQueryPoolsAndUsers() {
            return __awaiter(this, void 0, void 0, function* () {
                let res = yield client.queryContractSmart(contractAddress, {
                    debug_query_pools_and_users: {},
                });
                (0, utils_1.l)("\n", res, "\n");
                return res;
            });
        }
        function _cwQueryPoolsAndUsers() {
            return __awaiter(this, void 0, void 0, function* () {
                let res = yield client.queryContractSmart(contractAddress, {
                    query_pools_and_users: {},
                });
                (0, utils_1.l)("\n", res, "\n");
                return res;
            });
        }
        function _cwDepositNew(user) {
            return __awaiter(this, void 0, void 0, function* () {
                const { deposited_on_current_period, deposited_on_next_period } = user;
                let tokenAmount = +deposited_on_current_period + +deposited_on_next_period;
                const res = yield client.execute(owner, contractAddress, { deposit: { user } }, clients_1.fee, "", [(0, stargate_1.coin)(tokenAmount, interfaces_1.DENOMS.EEUR)]);
                const { attributes } = res.logs[0].events[2];
                (0, utils_1.l)({ attributes }, "\n");
                return attributes;
            });
        }
        function _cwWithdrawNew(tokenAmount) {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield client.execute(owner, contractAddress, { withdraw: { amount: tokenAmount.toString() } }, clients_1.fee, "");
                const { attributes } = res.logs[0].events[2];
                (0, utils_1.l)({ attributes }, "\n");
                return attributes;
            });
        }
        function _cwUpdatePoolsAndUsers(pools, users) {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield client.execute(owner, contractAddress, { update_pools_and_users: { pools, users } }, clients_1.fee, "");
                (0, utils_1.l)({ attributes: res.logs[0].events[2].attributes }, "\n");
            });
        }
        function _cwQueryAssets(address) {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield client.queryContractSmart(contractAddress, {
                    query_assets: { address },
                });
                (0, utils_1.l)("\n", res, "\n");
                return res;
            });
        }
        function _cwSwap() {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield client.execute(owner, contractAddress, { swap: {} }, clients_1.fee, "");
                (0, utils_1.l)({ attributes: res.logs[0].events[2].attributes }, "\n");
            });
        }
        function _cwDebugQueryBank() {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield client.queryContractSmart(contractAddress, {
                    debug_query_bank: {},
                });
                (0, utils_1.l)("\n", res, "\n");
            });
        }
        function _cwTransfer() {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield client.execute(owner, contractAddress, { transfer: {} }, clients_1.fee, "");
                // l({ attributes: res.logs[0].events[2].attributes }, "\n");
                (0, utils_1.l)(res, "\n");
                (0, utils_1.l)(((_a = res.logs[0].events[5]) === null || _a === void 0 ? void 0 : _a.attributes.filter((item) => item.key === "packet_data")) || "", "\n");
            });
        }
        function _cwMultiTransfer(transferParams) {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield client.execute(owner, contractAddress, { multi_transfer: { params: transferParams } }, clients_1.fee, "");
                (0, utils_1.l)(res);
                (0, utils_1.l)(res.logs[0].events[5].attributes, "\n");
            });
        }
        function _cwSgSend() {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield client.execute(owner, contractAddress, { sg_send: {} }, clients_1.fee, "");
                (0, utils_1.l)({ attributes: res.logs[0].events[2].attributes }, "\n");
            });
        }
        return {
            owner,
            _cwGetBankBalance,
            _cwDeposit,
            _cwTransfer,
            _cwSwap,
            _cwGetPools,
            _cwGetPrices,
            _cwDebugQueryPoolsAndUsers,
            _cwQueryPoolsAndUsers,
            _cwDepositNew,
            _cwWithdrawNew,
            _cwUpdatePoolsAndUsers,
            _cwQueryAssets,
            _cwDebugQueryBank,
            _cwMultiTransfer,
            _cwSgSend,
        };
    });
}
exports.getCwHelpers = getCwHelpers;
