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
exports.fee = exports.getGasPriceFromChainRegistryItem = exports.signAndBroadcastWrapper = exports.getAddrByPrefix = exports.getCwClient = exports.getSgClient = void 0;
const utils_1 = require("../utils");
const encoding_1 = require("@cosmjs/encoding");
const cosmwasm_stargate_1 = require("@cosmjs/cosmwasm-stargate");
const stargate_1 = require("@cosmjs/stargate");
// TODO: replace
const fee = {
    amount: [(0, stargate_1.coin)(0, "uosmo")],
    gas: `${700000}`,
};
exports.fee = fee;
function getSgClient(rpc, owner, signer) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (owner && signer) {
                const signingClient = yield stargate_1.SigningStargateClient.connectWithSigner(rpc, signer);
                return { client: signingClient, owner };
            }
            const client = yield stargate_1.StargateClient.connect(rpc);
            return { client };
        }
        catch (error) {
            (0, utils_1.l)(error);
        }
    });
}
exports.getSgClient = getSgClient;
function getCwClient(rpc, owner, signer) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (owner && signer) {
                const signingClient = yield cosmwasm_stargate_1.SigningCosmWasmClient.connectWithSigner(rpc, signer);
                return { client: signingClient, owner };
            }
            const client = yield cosmwasm_stargate_1.CosmWasmClient.connect(rpc);
            return { client };
        }
        catch (error) {
            (0, utils_1.l)(error);
        }
    });
}
exports.getCwClient = getCwClient;
function getAddrByPrefix(address, prefix) {
    return (0, encoding_1.toBech32)(prefix, (0, encoding_1.fromBech32)(address).data);
}
exports.getAddrByPrefix = getAddrByPrefix;
function signAndBroadcastWrapper(client, signerAddress, margin = 1.2) {
    return (messages, gasPrice, memo) => __awaiter(this, void 0, void 0, function* () {
        const gasSimulated = yield client.simulate(signerAddress, messages, memo);
        const gasWanted = Math.ceil(margin * gasSimulated);
        const fee = (0, stargate_1.calculateFee)(gasWanted, gasPrice);
        return yield client.signAndBroadcast(signerAddress, messages, fee, memo);
    });
}
exports.signAndBroadcastWrapper = signAndBroadcastWrapper;
function getGasPriceFromChainRegistryItem(chain, chainType) {
    var _a, _b;
    const response = chainType === "main" ? chain.main : chain.test;
    const gasPriceAmountDefault = 0.005;
    let gasPriceAmount = 0;
    const minGasPrice = (_b = (_a = response === null || response === void 0 ? void 0 : response.fees.fee_tokens) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.fixed_min_gas_price;
    if (minGasPrice)
        gasPriceAmount = minGasPrice;
    gasPriceAmount = Math.max(gasPriceAmountDefault, gasPriceAmount);
    const gasPrice = `${gasPriceAmount}${chain.denomNative}`;
    return gasPrice;
}
exports.getGasPriceFromChainRegistryItem = getGasPriceFromChainRegistryItem;
