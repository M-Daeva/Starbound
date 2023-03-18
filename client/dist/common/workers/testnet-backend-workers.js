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
const stargate_1 = require("@cosmjs/stargate");
const signers_1 = require("../signers");
const cw_helpers_1 = require("../helpers/cw-helpers");
const sg_helpers_1 = require("../helpers/sg-helpers");
const testnet_config_json_1 = require("../config/testnet-config.json");
const aliceClientStruct = {
    prefix: testnet_config_json_1.PREFIX,
    RPC: testnet_config_json_1.RPC,
    seed: testnet_config_json_1.SEED_ALICE,
};
const bobClientStruct = {
    prefix: testnet_config_json_1.PREFIX,
    RPC: testnet_config_json_1.RPC,
    seed: testnet_config_json_1.SEED_BOB,
};
const req = (0, utils_1.createRequest)({});
function init(seed) {
    return __awaiter(this, void 0, void 0, function* () {
        const dappClientStruct = {
            prefix: testnet_config_json_1.PREFIX,
            RPC: testnet_config_json_1.RPC,
            seed,
        };
        const dappClientStructJuno = {
            prefix: "juno",
            //RPC: "https://rpc.uni.juno.deuslabs.fi:443",
            RPC: "https://rpc.uni.junonetwork.io:443",
            seed,
        };
        // dapp cosmwasm helpers
        const { owner: dappAddr, cwSwap: _cwSwap, cwQueryPoolsAndUsers: _cwQueryPoolsAndUsers, cwUpdatePoolsAndUsers: _cwUpdatePoolsAndUsers, cwQueryUser: _cwQueryUser, cwTransfer: _cwTransfer, cwUpdateConfig: _cwUpdateConfig, cwQueryConfig: _cwQueryConfig,
        // cwMultiTransfer: _cwMultiTransfer,
         } = yield (0, cw_helpers_1.getCwHelpers)(dappClientStruct, testnet_config_json_1.CONTRACT_ADDRESS);
        // dapp stargate helpers
        const { sgUpdatePoolList: _sgUpdatePoolList, sgTransfer: _sgTransfer, sgSend: _sgSend, } = yield (0, sg_helpers_1.getSgHelpers)(dappClientStruct);
        const { sgDelegateFrom: _sgDelegateFrom, sgGetTokenBalances: _sgGetTokenBalances, } = yield (0, sg_helpers_1.getSgHelpers)(dappClientStructJuno);
        function sgUpdatePoolList() {
            return __awaiter(this, void 0, void 0, function* () {
                let pools = yield _sgUpdatePoolList();
                (0, utils_1.l)({ pools });
            });
        }
        function _queryBalance() {
            return __awaiter(this, void 0, void 0, function* () {
                let balances = yield _sgGetTokenBalances(testnet_config_json_1.CONTRACT_ADDRESS);
                (0, utils_1.l)({ contract: balances });
            });
        }
        // const grantStakeStruct: DelegationStruct = {
        //   targetAddr: dappAddr,
        //   tokenAmount: 1_000,
        //   tokenDenom: DENOMS.JUNO,
        //   validatorAddr: "junovaloper1w8cpaaljwrytquj86kvp9s72lvmddcc208ghun",
        // };
        function sgDelegateFrom(stakeFromStruct) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const tx = yield _sgDelegateFrom(stakeFromStruct);
                    (0, utils_1.l)(tx, "\n");
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
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
                    const gasPrice = (0, signers_1.getGasPriceFromChainRegistryItem)(chain, chainType);
                    const dappClientStruct = {
                        prefix: chain.prefix,
                        RPC: rpc,
                        seed: testnet_config_json_1.SEED_DAPP,
                    };
                    const { sgDelegateFromList: _sgDelegateFromList } = yield (0, sg_helpers_1.getSgHelpers)(dappClientStruct);
                    let delegationStructList = [];
                    for (let [granter, valoper] of granterValoperList) {
                        const urlHolded = `${rest}/cosmos/bank/v1beta1/balances/${granter}`;
                        try {
                            const balHolded = yield (0, utils_1.specifyTimeout)(req.get(urlHolded), 10000);
                            const balance = balHolded.balances.find((item) => item.denom === denom);
                            const amount = +((balance === null || balance === void 0 ? void 0 : balance.amount) || "0");
                            // skip delegation if amount <= threshold
                            if (amount <= threshold)
                                return;
                            const delegationStruct = {
                                targetAddr: granter,
                                tokenAmount: amount - threshold,
                                // tokenAmount: 1,
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
        function cwMockUpdatePoolsAndUsers(poolsAndUsers, gasPrice) {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)("cwMockUpdatePoolsAndUsers");
                let { pools, users } = poolsAndUsers;
                pools = pools.map((pool) => {
                    return Object.assign(Object.assign({}, pool), { price: `${1.1 * +pool.price}` });
                });
                users = users.map((user) => {
                    let asset_list = user.asset_list.map((asset) => {
                        return Object.assign(Object.assign({}, asset), { wallet_balance: `${+asset.wallet_balance + 1}` });
                    });
                    return Object.assign(Object.assign({}, user), { asset_list });
                });
                try {
                    yield _cwUpdatePoolsAndUsers(pools, users, gasPrice);
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwQueryUser() {
            return __awaiter(this, void 0, void 0, function* () {
                let aliceAddr = "osmo1gjqnuhv52pd2a7ets2vhw9w9qa9knyhy7y9tgx";
                let bobAddr = "osmo1chgwz55h9kepjq0fkj5supl2ta3nwu63e3ds8x";
                let addresses = [aliceAddr, bobAddr];
                for (let addr of addresses) {
                    try {
                        yield _cwQueryUser(addr);
                    }
                    catch (error) {
                        (0, utils_1.l)(error, "\n");
                    }
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
        const junoChannel = "channel-1110";
        const junoAddr = "juno1xjeu7n97xs0pv7lxcedat00d6vgyr9m54vefn2";
        const junoRevision = "5";
        const junoHeight = "500000";
        let junoAmount = "1";
        let timeout_in_mins = 5;
        let timestamp = `${Date.now() + timeout_in_mins * 60 * 1000}000000`;
        // let junoParams: TransferParams = {
        //   channel_id: junoChannel,
        //   to: junoAddr,
        //   amount: junoAmount,
        //   denom: DENOMS.JUNO,
        //   block_revision: junoRevision,
        //   block_height: junoHeight,
        //   timestamp,
        // };
        // let params: TransferParams[] = [
        //   junoParams,
        //   //	junoParams
        // ];
        // async function cwMultiTransfer() {
        //   l("cwMultiTransfer");
        //   try {
        //     await _cwMultiTransfer(params);
        //   } catch (error) {
        //     l(error, "\n");
        //   }
        // }
        let ibcStruct = {
            amount: 1,
            dstPrefix: "juno",
            sourceChannel: junoChannel,
            sourcePort: "transfer",
        };
        function sgTransfer() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const tx = yield _sgTransfer(ibcStruct);
                    (0, utils_1.l)(tx, "\n");
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function sgSend() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const tx = yield _sgSend(testnet_config_json_1.CONTRACT_ADDRESS, (0, stargate_1.coin)(500000, "uosmo"));
                    (0, utils_1.l)(tx, "\n");
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
            _queryBalance,
            cwSwap,
            sgDelegateFrom,
            sgUpdatePoolList,
            cwQueryPoolsAndUsers,
            cwMockUpdatePoolsAndUsers,
            cwQueryUser,
            cwTransfer,
            // cwMultiTransfer,
            cwUpdatePoolsAndUsers,
            sgTransfer,
            sgSend,
            sgDelegateFromAll,
            cwQueryConfig,
            cwUpdateConfig,
        };
    });
}
exports.init = init;
