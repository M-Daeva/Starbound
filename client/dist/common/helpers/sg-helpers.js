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
const helpers_1 = require("@osmonauts/helpers");
const authz_1 = require("cosmjs-types/cosmos/staking/v1beta1/authz");
const tx_1 = require("cosmjs-types/cosmos/staking/v1beta1/tx");
const utils_1 = require("../utils");
const signers_1 = require("../signers");
const decimal_js_1 = __importDefault(require("decimal.js"));
const assets_1 = require("./assets");
function getSgHelpers(clientStruct) {
    return __awaiter(this, void 0, void 0, function* () {
        const { client, owner } = yield (0, signers_1.getSgClient)(clientStruct);
        function _sgTransfer(ibcStruct) {
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
                        revisionNumber: helpers_1.Long.fromNumber(1),
                        revisionHeight: helpers_1.Long.fromNumber(height),
                    },
                    timeoutTimestamp: helpers_1.Long.fromNumber(0),
                };
                const msg = {
                    typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
                    value: msgIbcTransfer,
                };
                const tx = yield client.signAndBroadcast(owner, [msg], signers_1.fee);
                return tx;
            });
        }
        function _sgSwap(swapStruct) {
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
        function _sgGrantStakeAuth(delegationStruct) {
            return __awaiter(this, void 0, void 0, function* () {
                const { targetAddr, tokenAmount, tokenDenom, validatorAddr } = delegationStruct;
                const timestamp = {
                    seconds: helpers_1.Long.fromNumber(1700000000),
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
        function _sgDelegateFrom(delegationStruct) {
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
                const tx = yield client.signAndBroadcast(owner, [msg], signers_1.fee);
                return tx;
            });
        }
        function _sgGetTokenBalances(addr = owner) {
            return __awaiter(this, void 0, void 0, function* () {
                let balances = yield client.getAllBalances(addr);
                return balances.map(({ amount, denom }) => ({
                    amount,
                    symbol: (0, assets_1.getSymbolByDenom)(denom),
                }));
            });
        }
        function _sgUpdatePoolList() {
            return __awaiter(this, void 0, void 0, function* () {
                let url = "https://api-osmosis.imperator.co/pools/v2/all?low_liquidity=false";
                // download pools info
                let poolDatabase = yield (yield fetch(url)).json();
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
        function _sgSend(recipient, amount) {
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
            _sgSwap,
            _sgTransfer,
            _sgGrantStakeAuth,
            _sgDelegateFrom,
            _sgGetTokenBalances,
            _sgUpdatePoolList,
            _sgSend,
        };
    });
}
exports.getSgHelpers = getSgHelpers;
