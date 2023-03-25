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
exports.getGasPriceFromChainRegistryItem = exports.signAndBroadcastWrapper = exports.fee = exports.getAddrByChainPrefix = exports.initWalletList = exports.getAddrByPrefix = exports.getCwClient = exports.getSgClient = void 0;
const utils_1 = require("../utils");
const encoding_1 = require("@cosmjs/encoding");
const cosmwasm_stargate_1 = require("@cosmjs/cosmwasm-stargate");
const proto_signing_1 = require("@cosmjs/proto-signing");
const stargate_1 = require("@cosmjs/stargate");
// TODO: replace
const fee = {
    amount: [(0, stargate_1.coin)(0, "uosmo")],
    gas: `${700000}`,
};
exports.fee = fee;
function _detectWallet() {
    const { keplr } = window;
    if (!keplr)
        throw new Error("You need to install Keplr");
    return keplr;
}
function _getChainInfo(asset, chainType) {
    if (!asset)
        throw new Error("Chain registry info is not provided!");
    let network;
    if (chainType === "main" && asset.main) {
        network = asset.main;
    }
    if (chainType === "test" && asset.test) {
        network = asset.test;
    }
    if (!network)
        throw new Error("Chain info is not found!");
    // fix for juno testnet and mainnet denoms
    if (network.chain_id.includes("uni-")) {
        asset.denomNative = "ujunox";
    }
    let chainInfo = {
        chainId: network.chain_id,
        chainName: network.chain_name,
        rpc: network.apis.rpc[0].address,
        rest: network.apis.rest[0].address,
        stakeCurrency: {
            coinDenom: asset.symbol,
            coinMinimalDenom: asset.denomNative,
            coinDecimals: asset.exponent,
            coinGeckoId: asset.coinGeckoId,
        },
        bip44: { coinType: 118 },
        bech32Config: {
            bech32PrefixAccAddr: `${network.bech32_prefix}`,
            bech32PrefixAccPub: `${network.bech32_prefix}pub`,
            bech32PrefixValAddr: `${network.bech32_prefix}valoper`,
            bech32PrefixValPub: `${network.bech32_prefix}valoperpub`,
            bech32PrefixConsAddr: `${network.bech32_prefix}valcons`,
            bech32PrefixConsPub: `${network.bech32_prefix}valconspub`,
        },
        currencies: [
            {
                coinDenom: asset.symbol,
                coinMinimalDenom: asset.denomNative,
                coinDecimals: asset.exponent,
                coinGeckoId: asset.coinGeckoId,
            },
        ],
        feeCurrencies: [
            {
                coinDenom: asset.symbol,
                coinMinimalDenom: asset.denomNative,
                coinDecimals: asset.exponent,
                coinGeckoId: asset.coinGeckoId,
            },
        ],
    };
    return chainInfo;
}
function _addChainList(wallet, chainRegistry, chainType) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let asset of chainRegistry) {
            try {
                const chainInfo = _getChainInfo(asset, chainType);
                yield wallet.experimentalSuggestChain(chainInfo);
            }
            catch (error) {
                (0, utils_1.l)(error);
            }
        }
    });
}
function _unlockWalletList(wallet, chainRegistry, chainType) {
    return __awaiter(this, void 0, void 0, function* () {
        let promises = [];
        for (let asset of chainRegistry) {
            try {
                const chainInfo = _getChainInfo(asset, chainType);
                promises.push(wallet.enable(chainInfo.chainId));
            }
            catch (error) {
                (0, utils_1.l)(error);
            }
        }
        yield Promise.all(promises);
    });
}
function initWalletList(chainRegistry, chainType) {
    return __awaiter(this, void 0, void 0, function* () {
        const wallet = _detectWallet();
        if (!chainRegistry || !wallet)
            return;
        yield _addChainList(wallet, chainRegistry, chainType); // add network to Keplr
        yield _unlockWalletList(wallet, chainRegistry, chainType); // give permission for the webpage to access Keplr
        return wallet;
    });
}
exports.initWalletList = initWalletList;
function _getSigner(clientStruct) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let owner;
        let signer;
        if ("wallet" in clientStruct) {
            const { chainId, wallet } = clientStruct;
            signer = (_a = window.getOfflineSigner) === null || _a === void 0 ? void 0 : _a.call(window, chainId);
            owner = (yield wallet.getKey(chainId)).bech32Address;
        }
        else if ("seed" in clientStruct) {
            const { seed, prefix } = clientStruct;
            signer = yield proto_signing_1.DirectSecp256k1HdWallet.fromMnemonic(seed, { prefix });
            owner = (yield signer.getAccounts())[0].address;
        }
        else
            throw new Error("Wrong arguments!");
        return { signer, owner, RPC: clientStruct.RPC };
    });
}
function getSgClient(clientStruct) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { signer, owner, RPC } = yield _getSigner(clientStruct);
            if (!signer)
                throw new Error("Signer is undefined!");
            const client = yield stargate_1.SigningStargateClient.connectWithSigner(RPC, signer);
            return { client, owner };
        }
        catch (error) {
            (0, utils_1.l)(error);
        }
    });
}
exports.getSgClient = getSgClient;
function getCwClient(clientStruct) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { signer, owner, RPC } = yield _getSigner(clientStruct);
            if (!signer)
                throw new Error("Signer is undefined!");
            const client = yield cosmwasm_stargate_1.SigningCosmWasmClient.connectWithSigner(RPC, signer);
            return { client, owner };
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
function getAddrByChainPrefix(chainRegistry, chainType, prefix) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        let wallet = _detectWallet();
        if (!wallet)
            return;
        const chain = chainRegistry.find((item) => item.prefix === prefix);
        let chainId;
        if (chainType === "main") {
            chainId = (_a = chain === null || chain === void 0 ? void 0 : chain.main) === null || _a === void 0 ? void 0 : _a.chain_id;
        }
        else {
            chainId = (_b = chain === null || chain === void 0 ? void 0 : chain.test) === null || _b === void 0 ? void 0 : _b.chain_id;
        }
        if (!chain || !chainId)
            return;
        yield _unlockWalletList(wallet, [chain], chainType); // give permission for the webpage to access Keplr
        return (yield wallet.getKey(chainId)).bech32Address;
    });
}
exports.getAddrByChainPrefix = getAddrByChainPrefix;
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
