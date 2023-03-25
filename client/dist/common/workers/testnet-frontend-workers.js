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
const signers_1 = require("../signers");
const testnet_config_json_1 = require("../config/testnet-config.json");
function init(chains, chainType) {
    return __awaiter(this, void 0, void 0, function* () {
        let response;
        let chainId;
        const chain = chains === null || chains === void 0 ? void 0 : chains.find((item) => item.denomNative === "uosmo");
        if (!chain)
            return;
        if (chainType === "main" && chain.main) {
            response = chain.main;
            chainId = response.chain_id;
        }
        if (chainType === "test" && chain.test) {
            response = chain.test;
            chainId = response.chain_id;
        }
        if (!response || !chainId)
            return;
        const wallet = yield (0, signers_1.initWalletList)([chain], chainType);
        if (!wallet)
            return;
        const userClientStruct = {
            RPC: testnet_config_json_1.RPC,
            wallet,
            chainId,
        };
        // user cosmwasm helpers
        const userCwHelpers = yield (0, cw_helpers_1.getCwHelpers)(userClientStruct, testnet_config_json_1.CONTRACT_ADDRESS);
        if (!userCwHelpers)
            return;
        const { cwDeposit: _cwDeposit, cwWithdraw: _cwWithdraw, cwQueryPoolsAndUsers: _cwQueryPoolsAndUsers, cwQueryUser: _cwQueryUser, owner, } = userCwHelpers;
        function cwDeposit(userAlice) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const tx = yield _cwDeposit(userAlice);
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
                    const tx = yield _cwWithdraw(amount);
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
        function cwQueryUser(address) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield _cwQueryUser(address);
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        return {
            cwDeposit,
            cwWithdraw,
            cwQueryPoolsAndUsers,
            cwQueryUser,
            owner,
        };
    });
}
exports.init = init;
