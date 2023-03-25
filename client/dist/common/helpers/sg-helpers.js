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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSgHelpers = void 0;
const stargate_1 = require("@cosmjs/stargate");
const long_1 = __importDefault(require("osmojs/node_modules/long"));
const authz_1 = require("cosmjs-types/cosmos/staking/v1beta1/authz");
const tx_1 = require("cosmjs-types/cosmos/staking/v1beta1/tx");
const utils_1 = require("../utils");
const signers_1 = require("../signers");
const decimal_js_1 = __importDefault(require("decimal.js"));
const assets_1 = require("./assets");
const req = (0, utils_1.createRequest)({});
function getSgHelpers(clientStruct) {
    return __awaiter(this, void 0, void 0, function* () {
        const sgClient = yield (0, signers_1.getSgClient)(clientStruct);
        if (!sgClient)
            return;
        const { client, owner } = sgClient;
        const signAndBroadcast = (0, signers_1.signAndBroadcastWrapper)(client, owner);
        function sgTransfer(ibcStruct) {
            return __awaiter(this, void 0, void 0, function* () {
                const { amount, dstPrefix, sourceChannel, sourcePort } = ibcStruct;
                const receiver = (0, signers_1.getAddrByPrefix)(owner, dstPrefix);
                (0, utils_1.l)({ sender: owner, receiver });
                const height = yield client.getHeight();
                const msgIbcTransfer = {
                    sender: owner,
                    receiver,
                    token: (0, stargate_1.coin)(amount, assets_1.DENOMS.OSMO),
                    sourceChannel,
                    sourcePort,
                    timeoutHeight: {
                        revisionNumber: long_1.default.fromNumber(1),
                        revisionHeight: long_1.default.fromNumber(height),
                    },
                    timeoutTimestamp: long_1.default.fromNumber(0),
                };
                const msg = {
                    typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
                    value: msgIbcTransfer,
                };
                const tx = yield client.signAndBroadcast(owner, [msg], signers_1.fee);
                return tx;
            });
        }
        function sgSwap(swapStruct) {
            return __awaiter(this, void 0, void 0, function* () {
                const { amount, from, to } = swapStruct;
                const msgSwapExactAmountIn = {
                    routes: (0, assets_1.getRoutes)(from, to),
                    sender: owner,
                    tokenIn: (0, stargate_1.coin)(amount, assets_1.DENOMS[from]),
                    tokenOutMinAmount: "1",
                };
                const msg = {
                    typeUrl: "/osmosis.gamm.v1beta1.MsgSwapExactAmountIn",
                    value: msgSwapExactAmountIn,
                };
                const tx = yield client.signAndBroadcast(owner, [msg], signers_1.fee);
                return tx;
            });
        }
        function sgGrantStakeAuth(delegationStruct) {
            return __awaiter(this, void 0, void 0, function* () {
                const { targetAddr, tokenAmount, tokenDenom, validatorAddr } = delegationStruct;
                const timestamp = {
                    seconds: long_1.default.fromNumber(1700000000),
                    nanos: 0,
                };
                const grant = {
                    authorization: {
                        typeUrl: "/cosmos.staking.v1beta1.StakeAuthorization",
                        value: authz_1.StakeAuthorization.encode(authz_1.StakeAuthorization.fromPartial({
                            allowList: { address: [validatorAddr] },
                            maxTokens: (0, stargate_1.coin)(tokenAmount, tokenDenom),
                            authorizationType: 1,
                        })).finish(),
                    },
                    expiration: timestamp,
                };
                const msgGrant = {
                    granter: owner,
                    grantee: targetAddr,
                    grant,
                };
                const msg = {
                    typeUrl: "/cosmos.authz.v1beta1.MsgGrant",
                    value: msgGrant,
                };
                const tx = yield client.signAndBroadcast(owner, [msg], signers_1.fee);
                return tx;
            });
        }
        function sgRevokeStakeAuth(delegationStruct) {
            return __awaiter(this, void 0, void 0, function* () {
                const { targetAddr } = delegationStruct;
                (0, utils_1.l)({ targetAddr });
                const msgRevoke = {
                    granter: owner,
                    grantee: targetAddr,
                    msgTypeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
                };
                const msg = {
                    typeUrl: "/cosmos.authz.v1beta1.MsgRevoke",
                    value: msgRevoke,
                };
                const tx = yield client.signAndBroadcast(owner, [msg], signers_1.fee);
                return tx;
            });
        }
        function sgDelegateFrom(delegationStruct, specifiedFee = signers_1.fee) {
            return __awaiter(this, void 0, void 0, function* () {
                const { targetAddr, tokenAmount, tokenDenom, validatorAddr } = delegationStruct;
                const msg1 = {
                    typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
                    value: tx_1.MsgDelegate.encode(tx_1.MsgDelegate.fromPartial({
                        delegatorAddress: targetAddr,
                        validatorAddress: validatorAddr,
                        amount: (0, stargate_1.coin)(tokenAmount, tokenDenom),
                    })).finish(),
                };
                const msgExec = {
                    grantee: owner,
                    msgs: [msg1],
                };
                const msg = {
                    typeUrl: "/cosmos.authz.v1beta1.MsgExec",
                    value: msgExec,
                };
                const tx = yield client.signAndBroadcast(owner, [msg], specifiedFee);
                return tx;
            });
        }
        function sgDelegateFromList(delegationStructList, gasPrice) {
            return __awaiter(this, void 0, void 0, function* () {
                const msgList = delegationStructList.map(({ targetAddr, tokenAmount, tokenDenom, validatorAddr }) => ({
                    typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
                    value: tx_1.MsgDelegate.encode(tx_1.MsgDelegate.fromPartial({
                        delegatorAddress: targetAddr,
                        validatorAddress: validatorAddr,
                        amount: (0, stargate_1.coin)(tokenAmount, tokenDenom),
                    })).finish(),
                }));
                const msgExec = {
                    grantee: owner,
                    msgs: msgList,
                };
                const obj = {
                    typeUrl: "/cosmos.authz.v1beta1.MsgExec",
                    value: msgExec,
                };
                return yield signAndBroadcast([obj], gasPrice);
            });
        }
        function sgGetTokenBalances(addr = owner) {
            return __awaiter(this, void 0, void 0, function* () {
                let balances = yield client.getAllBalances(addr);
                return balances.map(({ amount, denom }) => ({
                    amount,
                    symbol: (0, assets_1.getSymbolByDenom)(denom),
                }));
            });
        }
        function sgUpdatePoolList() {
            return __awaiter(this, void 0, void 0, function* () {
                let url = "https://api-osmosis.imperator.co/pools/v2/all?low_liquidity=false";
                // download pools info
                let poolDatabase = yield req.get(url);
                // skip low liquidity pools
                let valid_pools = [];
                Object.entries(poolDatabase).forEach(([key, [assetFirst, assetSecond]]) => {
                    if (assetSecond.denom === "uosmo" &&
                        assetSecond.liquidity > 100000 &&
                        key !== "678") {
                        valid_pools.push({
                            id: +key,
                            denom: assetFirst.denom,
                            price: new decimal_js_1.default(assetFirst.price),
                        });
                    }
                });
                return valid_pools;
            });
        }
        function sgSend(recipient, amount) {
            return __awaiter(this, void 0, void 0, function* () {
                const msg = {
                    typeUrl: "/cosmos.bank.v1beta1.MsgSend",
                    value: {
                        fromAddress: owner,
                        toAddress: recipient,
                        amount: [amount],
                    },
                };
                const tx = yield client.signAndBroadcast(owner, [msg], signers_1.fee);
                return tx;
            });
        }
        return {
            owner,
            sgSwap,
            sgTransfer,
            sgGrantStakeAuth,
            sgRevokeStakeAuth,
            sgDelegateFrom,
            sgGetTokenBalances,
            sgUpdatePoolList,
            sgSend,
            sgDelegateFromList,
        };
    });
}
exports.getSgHelpers = getSgHelpers;
