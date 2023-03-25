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
const utils_1 = require("../utils");
const signers_1 = require("../signers");
const assets_1 = require("./assets");
const Starbound_client_1 = require("../codegen/Starbound.client");
const Starbound_message_composer_1 = require("../codegen/Starbound.message-composer");
function getCwHelpers(clientStruct, contractAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        const cwClient = yield (0, signers_1.getCwClient)(clientStruct);
        if (!cwClient)
            return;
        const { client: _client, owner } = cwClient;
        const composer = new Starbound_message_composer_1.StarboundMessageComposer(owner, contractAddress);
        const client = new Starbound_client_1.StarboundClient(_client, owner, contractAddress);
        const _signAndBroadcast = (0, signers_1.signAndBroadcastWrapper)(_client, owner);
        function _msgWrapper(msg) {
            return __awaiter(this, void 0, void 0, function* () {
                const tx = yield _client.signAndBroadcast(owner, [msg], signers_1.fee);
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
                const { deposited } = user;
                const tokenAmount = +deposited;
                const funds = { amount: `${tokenAmount}`, denom: assets_1.DENOMS.EEUR };
                return yield _msgWrapper(composer.deposit({ user }, tokenAmount ? [funds] : []));
            });
        }
        function cwWithdraw(tokenAmount) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield _msgWrapper(composer.withdraw({ amount: `${tokenAmount}` }));
            });
        }
        function cwUpdateConfig(updateConfigStruct, gasPrice) {
            return __awaiter(this, void 0, void 0, function* () {
                const { dappAddressAndDenomList, feeDefault: _feeDefault, feeOsmo: _feeOsmo, scheduler, stablecoinDenom, stablecoinPoolId, } = updateConfigStruct;
                const feeDefault = !_feeDefault ? undefined : _feeDefault.toString();
                const feeOsmo = !_feeOsmo ? undefined : _feeOsmo.toString();
                return yield _msgWrapperWithGasPrice(composer.updateConfig({
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
                return yield _msgWrapperWithGasPrice(composer.updatePoolsAndUsers({ pools, users }), gasPrice);
            });
        }
        function cwSwap(gasPrice) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield _msgWrapperWithGasPrice(composer.swap(), gasPrice);
            });
        }
        function cwTransfer(gasPrice) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield _msgWrapperWithGasPrice(composer.transfer(), gasPrice);
            });
        }
        function cwMultiTransfer(params) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield _msgWrapper(composer.multiTransfer({ params }));
            });
        }
        function cwQueryUser(address) {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield client.queryUser({ address });
                (0, utils_1.l)("\n", res, "\n");
                return res;
            });
        }
        function cwQueryPoolsAndUsers() {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield client.queryPoolsAndUsers();
                // l("\n", res, "\n");
                return res;
            });
        }
        function cwQueryLedger() {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield client.queryLedger();
                (0, utils_1.l)("\n", res, "\n");
                return res;
            });
        }
        function cwQueryConfig() {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield client.queryConfig();
                (0, utils_1.l)("\n", res, "\n");
                return res;
            });
        }
        return {
            owner,
            cwDeposit,
            cwWithdraw,
            cwUpdateConfig,
            cwUpdatePoolsAndUsers,
            cwSwap,
            cwTransfer,
            cwMultiTransfer,
            cwQueryUser,
            cwQueryPoolsAndUsers,
            cwQueryLedger,
            cwQueryConfig,
        };
    });
}
exports.getCwHelpers = getCwHelpers;
