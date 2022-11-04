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
exports.init = void 0;
const utils_1 = require("../utils");
const cw_helpers_1 = require("../helpers/cw-helpers");
const sg_helpers_1 = require("../helpers/sg-helpers");
const signers_1 = require("../signers");
const testnet_config_json_1 = require("../config/testnet-config.json");
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        const wallet = yield (0, signers_1.initWallet)();
        const userClientStruct = {
            isKeplrType: true,
            RPC: testnet_config_json_1.RPC,
            wallet,
            chainId: "osmo-test-4",
        };
        const userClientStructJuno = {
            isKeplrType: true,
            RPC: "https://rpc.uni.juno.deuslabs.fi",
            wallet,
            chainId: "uni-5",
        };
        // user cosmwasm helpers
        const { _cwDepositNew, _cwWithdrawNew, _cwQueryPoolsAndUsers, _cwDebugQueryBank, _cwDebugQueryPoolsAndUsers, _cwQueryAssets, owner, } = yield (0, cw_helpers_1.getCwHelpers)(userClientStruct, testnet_config_json_1.CONTRACT_ADDRESS);
        // user stargate helpers
        const { _sgGrantStakeAuth } = yield (0, sg_helpers_1.getSgHelpers)(userClientStructJuno);
        function sgGrantStakeAuth(grantStakeStruct) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const tx = yield _sgGrantStakeAuth(grantStakeStruct);
                    (0, utils_1.l)(tx, "\n");
                    return tx;
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwDeposit(userAlice) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const tx = yield _cwDepositNew(userAlice);
                    return tx;
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwWithdraw(amount) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const tx = yield _cwWithdrawNew(amount);
                    return tx;
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwDebugQueryBank() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const tx = yield _cwDebugQueryBank();
                    return tx;
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwQueryPoolsAndUsers() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield _cwQueryPoolsAndUsers();
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwDebugQueryPoolsAndUsers() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield _cwDebugQueryPoolsAndUsers();
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwQueryAssets(address) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield _cwQueryAssets(address);
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        return {
            sgGrantStakeAuth,
            cwDeposit,
            cwWithdraw,
            cwDebugQueryBank,
            cwQueryPoolsAndUsers,
            cwDebugQueryPoolsAndUsers,
            cwQueryAssets,
            owner,
        };
    });
}
exports.init = init;
