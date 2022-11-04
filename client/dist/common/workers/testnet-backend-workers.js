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
const cw_helpers_1 = require("../helpers/cw-helpers");
const assets_1 = require("../helpers/assets");
const sg_helpers_1 = require("../helpers/sg-helpers");
const signers_1 = require("../signers");
const testnet_config_json_1 = require("../config/testnet-config.json");
const aliceClientStruct = {
    isKeplrType: false,
    prefix: testnet_config_json_1.PREFIX,
    RPC: testnet_config_json_1.RPC,
    seed: testnet_config_json_1.SEED_ALICE,
};
const bobClientStruct = {
    isKeplrType: false,
    prefix: testnet_config_json_1.PREFIX,
    RPC: testnet_config_json_1.RPC,
    seed: testnet_config_json_1.SEED_BOB,
};
const dappClientStruct = {
    isKeplrType: false,
    prefix: testnet_config_json_1.PREFIX,
    RPC: testnet_config_json_1.RPC,
    seed: testnet_config_json_1.SEED_DAPP,
};
const dappClientStructJuno = {
    isKeplrType: false,
    prefix: "juno",
    RPC: "https://rpc.uni.juno.deuslabs.fi:443",
    seed: testnet_config_json_1.SEED_DAPP,
};
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        // dapp cosmwasm helpers
        const { owner: dappAddr, _cwSwap, _cwGetPools, _cwGetPrices, _cwQueryPoolsAndUsers, _cwDebugQueryPoolsAndUsers, _cwUpdatePoolsAndUsers, _cwQueryAssets, _cwDebugQueryBank, _cwTransfer, _cwMultiTransfer, _cwSgSend, } = yield (0, cw_helpers_1.getCwHelpers)(dappClientStruct, testnet_config_json_1.CONTRACT_ADDRESS);
        // dapp stargate helpers
        const { _sgUpdatePoolList, _sgTransfer, _sgSend } = yield (0, sg_helpers_1.getSgHelpers)(dappClientStruct);
        const { _sgDelegateFrom, _sgGetTokenBalances } = yield (0, sg_helpers_1.getSgHelpers)(dappClientStructJuno);
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
        function sgDelegateFromAll(users) {
            return __awaiter(this, void 0, void 0, function* () {
                const denom = "ujunox";
                function delegate(user) {
                    return __awaiter(this, void 0, void 0, function* () {
                        try {
                            let addr = (0, signers_1.getAddrByPrefix)(user.osmo_address, "juno");
                            let balance = (yield _sgGetTokenBalances(addr)).find((item) => item.symbol === denom);
                            let delegation = balance !== undefined ? +balance.amount - 1000 : 0;
                            (0, utils_1.l)(addr, balance, delegation);
                            if (delegation >= 1000) {
                                let tx = yield _sgDelegateFrom({
                                    targetAddr: addr,
                                    tokenAmount: delegation,
                                    tokenDenom: denom,
                                    validatorAddr: "junovaloper1w8cpaaljwrytquj86kvp9s72lvmddcc208ghun",
                                });
                                (0, utils_1.l)(tx);
                            }
                        }
                        catch (error) {
                            (0, utils_1.l)(error);
                        }
                    });
                }
                for (let user of users) {
                    yield delegate(user);
                }
            });
        }
        function cwGetPools() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield _cwGetPools();
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwGetPrices() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield _cwGetPrices();
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwDebugQueryPoolsAndUsers() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield _cwDebugQueryPoolsAndUsers();
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
                    let empty = { pools: [], users: [] };
                    return empty;
                }
            });
        }
        function cwMockUpdatePoolsAndUsers(poolsAndUsers) {
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
                    yield _cwUpdatePoolsAndUsers(pools, users);
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwQueryAssets() {
            return __awaiter(this, void 0, void 0, function* () {
                let aliceAddr = "osmo1gjqnuhv52pd2a7ets2vhw9w9qa9knyhy7y9tgx";
                let bobAddr = "osmo1chgwz55h9kepjq0fkj5supl2ta3nwu63e3ds8x";
                let addresses = [aliceAddr, bobAddr];
                for (let addr of addresses) {
                    try {
                        yield _cwQueryAssets(addr);
                    }
                    catch (error) {
                        (0, utils_1.l)(error, "\n");
                    }
                }
            });
        }
        function cwSwap() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)("cwSwap");
                try {
                    yield _cwSwap();
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwDebugQueryBank() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield _cwDebugQueryBank();
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwTransfer() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)("cwTransfer");
                try {
                    yield _cwTransfer();
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
        let junoParams = {
            channel_id: junoChannel,
            to: junoAddr,
            amount: junoAmount,
            denom: assets_1.DENOMS.JUNO,
            block_revision: junoRevision,
            block_height: junoHeight,
        };
        let params = [
            junoParams,
            //	junoParams
        ];
        function cwMultiTransfer() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)("cwMultiTransfer");
                try {
                    yield _cwMultiTransfer(params);
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
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
        function cwSgSend() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const tx = yield _cwSgSend();
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
        return {
            _queryBalance,
            cwSwap,
            sgDelegateFrom,
            sgUpdatePoolList,
            cwGetPools,
            cwGetPrices,
            cwDebugQueryPoolsAndUsers,
            cwQueryPoolsAndUsers,
            cwMockUpdatePoolsAndUsers,
            cwQueryAssets,
            cwDebugQueryBank,
            cwTransfer,
            cwMultiTransfer,
            sgTransfer,
            cwSgSend,
            sgSend,
            sgDelegateFromAll,
        };
    });
}
exports.init = init;
