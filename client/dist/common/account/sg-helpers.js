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
exports.getSgQueryHelpers = exports.getSgExecHelpers = void 0;
const long_1 = __importDefault(require("long"));
const authz_1 = require("cosmjs-types/cosmos/staking/v1beta1/authz");
const tx_1 = require("cosmjs-types/cosmos/staking/v1beta1/tx");
const utils_1 = require("../utils");
const clients_1 = require("./clients");
const stargate_1 = require("@cosmjs/stargate");
function getSgExecHelpers(rpc, owner, signer) {
    return __awaiter(this, void 0, void 0, function* () {
        const sgClient = yield (0, clients_1.getSgClient)(rpc, owner, signer);
        if (!sgClient)
            return;
        const client = sgClient.client;
        const signAndBroadcast = (0, clients_1.signAndBroadcastWrapper)(client, owner);
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
                const tx = yield client.signAndBroadcast(owner, [msg], clients_1.fee);
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
                const tx = yield client.signAndBroadcast(owner, [msg], clients_1.fee);
                return tx;
            });
        }
        function sgDelegateFrom(delegationStruct, specifiedFee = clients_1.fee) {
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
                const tx = yield client.signAndBroadcast(owner, [msg], clients_1.fee);
                return tx;
            });
        }
        return {
            sgGrantStakeAuth,
            sgRevokeStakeAuth,
            sgDelegateFrom,
            sgSend,
            sgDelegateFromList,
        };
    });
}
exports.getSgExecHelpers = getSgExecHelpers;
function getSgQueryHelpers(rpc) {
    return __awaiter(this, void 0, void 0, function* () {
        const sgClient = yield (0, clients_1.getSgClient)(rpc);
        if (!sgClient)
            return;
        const client = sgClient.client;
        function getAllBalances(address) {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield client.getAllBalances(address);
                return res;
            });
        }
        return { getAllBalances };
    });
}
exports.getSgQueryHelpers = getSgQueryHelpers;
