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
exports.getCwQueryHelpers = exports.getCwExecHelpers = void 0;
const utils_1 = require("../utils");
const clients_1 = require("./clients");
const StarboundOsmosis_message_composer_1 = require("../codegen/StarboundOsmosis.message-composer");
const StarboundOsmosis_client_1 = require("../codegen/StarboundOsmosis.client");
function getCwExecHelpers(contractAddress, rpc, owner, signer) {
    return __awaiter(this, void 0, void 0, function* () {
        const cwClient = yield (0, clients_1.getCwClient)(rpc, owner, signer);
        if (!cwClient)
            return;
        const signingClient = cwClient.client;
        const msgComposer = new StarboundOsmosis_message_composer_1.StarboundOsmosisMessageComposer(owner, contractAddress);
        const _signAndBroadcast = (0, clients_1.signAndBroadcastWrapper)(signingClient, owner);
        function _msgWrapper(msg) {
            return __awaiter(this, void 0, void 0, function* () {
                const tx = yield signingClient.signAndBroadcast(owner, [msg], clients_1.fee);
                (0, utils_1.l)("\n", tx, "\n");
                return tx;
            });
        }
        function _msgWrapperWithGasPrice(msg, gasPrice) {
            return __awaiter(this, void 0, void 0, function* () {
                const tx = yield _signAndBroadcast([msg], gasPrice);
                (0, utils_1.l)("\n", tx, "\n");
                return tx;
            });
        }
        function cwDeposit(user) {
            return __awaiter(this, void 0, void 0, function* () {
                const EEUR_DENOM = "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F";
                const { deposited } = user;
                const tokenAmount = +deposited;
                const funds = {
                    amount: `${tokenAmount}`,
                    denom: EEUR_DENOM,
                };
                return yield _msgWrapper(msgComposer.deposit({ user }, tokenAmount ? [funds] : []));
            });
        }
        function cwWithdraw(tokenAmount) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield _msgWrapper(msgComposer.withdraw({ amount: `${tokenAmount}` }));
            });
        }
        function cwUpdateConfig(updateConfigStruct, gasPrice) {
            return __awaiter(this, void 0, void 0, function* () {
                const { dappAddressAndDenomList, feeDefault: _feeDefault, feeOsmo: _feeOsmo, scheduler, stablecoinDenom, stablecoinPoolId, } = updateConfigStruct;
                const feeDefault = !_feeDefault ? undefined : _feeDefault.toString();
                const feeOsmo = !_feeOsmo ? undefined : _feeOsmo.toString();
                return yield _msgWrapperWithGasPrice(msgComposer.updateConfig({
                    dappAddressAndDenomList,
                    feeDefault,
                    feeOsmo,
                    scheduler,
                    stablecoinDenom,
                    stablecoinPoolId,
                }), gasPrice);
            });
        }
        function cwUpdatePoolsAndUsers(pools, users, gasPrice) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield _msgWrapperWithGasPrice(msgComposer.updatePoolsAndUsers({ pools, users }), gasPrice);
            });
        }
        function cwSwap(gasPrice) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield _msgWrapperWithGasPrice(msgComposer.swap(), gasPrice);
            });
        }
        function cwTransfer(gasPrice) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield _msgWrapperWithGasPrice(msgComposer.transfer(), gasPrice);
            });
        }
        function cwMultiTransfer(params) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield _msgWrapper(msgComposer.multiTransfer({ params }));
            });
        }
        return {
            cwDeposit,
            cwWithdraw,
            cwUpdateConfig,
            cwUpdatePoolsAndUsers,
            cwSwap,
            cwTransfer,
            cwMultiTransfer,
        };
    });
}
exports.getCwExecHelpers = getCwExecHelpers;
function getCwQueryHelpers(contractAddress, rpc) {
    return __awaiter(this, void 0, void 0, function* () {
        const cwClient = yield (0, clients_1.getCwClient)(rpc);
        if (!cwClient)
            return;
        const cosmwasmQueryClient = cwClient.client;
        const queryClient = new StarboundOsmosis_client_1.StarboundOsmosisQueryClient(cosmwasmQueryClient, contractAddress);
        function cwQueryUser(address) {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield queryClient.queryUser({ address });
                (0, utils_1.l)("\n", res, "\n");
                return res;
            });
        }
        function cwQueryPoolsAndUsers() {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield queryClient.queryPoolsAndUsers();
                // l("\n", res, "\n");
                return res;
            });
        }
        function cwQueryLedger() {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield queryClient.queryLedger();
                (0, utils_1.l)("\n", res, "\n");
                return res;
            });
        }
        function cwQueryConfig() {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield queryClient.queryConfig();
                (0, utils_1.l)("\n", res, "\n");
                return res;
            });
        }
        return {
            cwQueryUser,
            cwQueryPoolsAndUsers,
            cwQueryLedger,
            cwQueryConfig,
        };
    });
}
exports.getCwQueryHelpers = getCwQueryHelpers;
