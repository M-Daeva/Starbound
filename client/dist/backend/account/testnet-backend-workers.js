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
const stargate_1 = require("@cosmjs/stargate");
const signer_1 = require("./signer");
const utils_1 = require("../../common/utils");
const clients_1 = require("../../common/account/clients");
const cw_helpers_1 = require("../../common/account/cw-helpers");
const sg_helpers_1 = require("../../common/account/sg-helpers");
const helpers_1 = require("../helpers");
const osmosis_testnet_config_json_1 = require("../../common/config/osmosis-testnet-config.json");
const req = new utils_1.Request();
function init(seed) {
    return __awaiter(this, void 0, void 0, function* () {
        const dappCwQueryHelpers = yield (0, cw_helpers_1.getCwQueryHelpers)(osmosis_testnet_config_json_1.CONTRACT_ADDRESS, osmosis_testnet_config_json_1.RPC);
        if (!dappCwQueryHelpers)
            return;
        const { cwQueryPoolsAndUsers: _cwQueryPoolsAndUsers, cwQueryUser: _cwQueryUser, cwQueryConfig: _cwQueryConfig, } = dappCwQueryHelpers;
        function sgGetPoolList() {
            return __awaiter(this, void 0, void 0, function* () {
                let pools = yield (0, helpers_1.getPoolList)();
                (0, utils_1.l)({ pools });
            });
        }
        function cwQueryPoolsAndUsers() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield _cwQueryPoolsAndUsers();
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                    let empty = { pools: [], users: [] };
                    return empty;
                }
            });
        }
        function cwQueryUser(addr) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield _cwQueryUser(addr);
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwQueryConfig() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield _cwQueryConfig();
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        if (!seed) {
            return {
                sgGetPoolList,
                cwQueryPoolsAndUsers,
                cwQueryUser,
                cwQueryConfig,
            };
        }
        const { signer, owner } = yield (0, signer_1.getSigner)(osmosis_testnet_config_json_1.RPC, osmosis_testnet_config_json_1.PREFIX, seed);
        // dapp cosmwasm helpers
        const dappCwExecHelpers = yield (0, cw_helpers_1.getCwExecHelpers)(osmosis_testnet_config_json_1.CONTRACT_ADDRESS, osmosis_testnet_config_json_1.RPC, owner, signer);
        if (!dappCwExecHelpers)
            return;
        const { cwSwap: _cwSwap, cwUpdatePoolsAndUsers: _cwUpdatePoolsAndUsers, cwTransfer: _cwTransfer, cwUpdateConfig: _cwUpdateConfig, } = dappCwExecHelpers;
        // dapp stargate helpers
        const dappSgExecHelpers = yield (0, sg_helpers_1.getSgExecHelpers)(osmosis_testnet_config_json_1.RPC, owner, signer);
        if (!dappSgExecHelpers)
            return;
        const { sgSend: _sgSend } = dappSgExecHelpers;
        function sgDelegateFromAll(denomGranterValoperList, chainRegistryResponse, chainType, threshold = 10000) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
            return __awaiter(this, void 0, void 0, function* () {
                if (!chainRegistryResponse)
                    return;
                for (let [denom, granterValoperList] of denomGranterValoperList) {
                    if (denom === "ujuno" && chainType === "test")
                        denom = "ujunox";
                    const chain = chainRegistryResponse.find((item) => item.denomNative === denom);
                    if (!chain)
                        continue;
                    let rest;
                    let rpc;
                    if (chainType === "main" && chain.main) {
                        rest = (_d = (_c = (_b = (_a = chain.main) === null || _a === void 0 ? void 0 : _a.apis) === null || _b === void 0 ? void 0 : _b.rest) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.address;
                        rpc = (_h = (_g = (_f = (_e = chain.main) === null || _e === void 0 ? void 0 : _e.apis) === null || _f === void 0 ? void 0 : _f.rpc) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.address;
                    }
                    if (chainType === "test" && chain.test) {
                        rest = (_m = (_l = (_k = (_j = chain.test) === null || _j === void 0 ? void 0 : _j.apis) === null || _k === void 0 ? void 0 : _k.rest) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.address;
                        rpc = (_r = (_q = (_p = (_o = chain.test) === null || _o === void 0 ? void 0 : _o.apis) === null || _p === void 0 ? void 0 : _p.rpc) === null || _q === void 0 ? void 0 : _q[0]) === null || _r === void 0 ? void 0 : _r.address;
                    }
                    if (!rest || !rpc)
                        continue;
                    const gasPrice = (0, clients_1.getGasPriceFromChainRegistryItem)(chain, chainType);
                    const { signer, owner } = yield (0, signer_1.getSigner)(rpc, chain.prefix, seed);
                    const dappSgExecHelpers = yield (0, sg_helpers_1.getSgExecHelpers)(rpc, owner, signer);
                    if (!dappSgExecHelpers)
                        return;
                    const { sgDelegateFromList: _sgDelegateFromList } = dappSgExecHelpers;
                    let delegationStructList = [];
                    for (let [granter, valoper] of granterValoperList) {
                        const urlHolded = `${rest}/cosmos/bank/v1beta1/balances/${granter}`;
                        try {
                            const balHolded = yield (0, utils_1.specifyTimeout)(req.get(urlHolded), 10000);
                            const balance = balHolded.balances.find((item) => item.denom === denom);
                            const amount = +((balance === null || balance === void 0 ? void 0 : balance.amount) || "0");
                            // skip delegation if amount <= threshold
                            //if (amount <= threshold) return;
                            const delegationStruct = {
                                targetAddr: granter,
                                //tokenAmount: amount - threshold,
                                tokenAmount: 1,
                                tokenDenom: denom,
                                validatorAddr: valoper,
                            };
                            delegationStructList.push(delegationStruct);
                        }
                        catch (error) {
                            (0, utils_1.l)(error);
                        }
                    }
                    try {
                        const tx = yield (0, utils_1.specifyTimeout)(_sgDelegateFromList(delegationStructList, gasPrice), 10000);
                        (0, utils_1.l)(tx);
                    }
                    catch (error) {
                        (0, utils_1.l)(error);
                    }
                }
            });
        }
        function cwUpdatePoolsAndUsers(pools, users, gasPrice) {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)("cwUpdatePoolsAndUsers");
                try {
                    const res = yield _cwUpdatePoolsAndUsers(pools, users, gasPrice);
                    (0, utils_1.l)(res.rawLog);
                }
                catch (error) {
                    (0, utils_1.l)(error);
                }
            });
        }
        function cwSwap(gasPrice) {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)("cwSwap");
                try {
                    yield _cwSwap(gasPrice);
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwTransfer(gasPrice) {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)("cwTransfer");
                try {
                    yield _cwTransfer(gasPrice);
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function sgSend() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const tx = yield _sgSend(osmosis_testnet_config_json_1.CONTRACT_ADDRESS, (0, stargate_1.coin)(500, "uosmo"));
                    (0, utils_1.l)(tx, "\n");
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwUpdateConfig(updateConfigStruct, gasPrice) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield _cwUpdateConfig(updateConfigStruct, gasPrice);
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        return {
            owner,
            cwSwap,
            sgGetPoolList,
            cwQueryPoolsAndUsers,
            cwQueryUser,
            cwTransfer,
            cwUpdatePoolsAndUsers,
            sgSend,
            sgDelegateFromAll,
            cwQueryConfig,
            cwUpdateConfig,
        };
    });
}
exports.init = init;
