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
exports.fee = exports.getAddrByPrefix = exports.getCwClient = exports.getSgClient = exports.initWallet = void 0;
const encoding_1 = require("@cosmjs/encoding");
const cosmwasm_stargate_1 = require("@cosmjs/cosmwasm-stargate");
const stargate_1 = require("@cosmjs/stargate");
const utils_1 = require("../utils");
const testnet_config_json_1 = require("../config/testnet-config.json");
const proto_signing_1 = require("@cosmjs/proto-signing");
const req = (0, utils_1.createRequest)({});
const CHAIN_ID2 = "uni-5";
const chainRegistryUrl = "https://github.com/cosmos/chain-registry/blob/master/testnets/osmosistestnet/chain.json";
const fee = {
    amount: [(0, stargate_1.coin)(0, "uosmo")],
    gas: "500000",
};
exports.fee = fee;
function detectWallet() {
    const { keplr } = window;
    if (!keplr) {
        (0, utils_1.l)("You need to install Keplr");
        return;
    }
    return keplr;
}
function addChain(wallet) {
    return __awaiter(this, void 0, void 0, function* () {
        let testnetChainInfo = {
            // Chain-id of the Osmosis chain.
            chainId: "osmo-test-4",
            // The name of the chain to be displayed to the user.
            chainName: "Osmosis Testnet",
            // RPC endpoint of the chain. In this case we are using blockapsis, as it's accepts connections from any host currently. No Cors limitations.
            rpc: "https://testnet-rpc.osmosis.zone/",
            // REST endpoint of the chain.
            rest: "https://testnet-rest.osmosis.zone/",
            // Staking coin information
            stakeCurrency: {
                // Coin denomination to be displayed to the user.
                coinDenom: "OSMO",
                // Actual denom (i.e. uatom, uscrt) used by the blockchain.
                coinMinimalDenom: "uosmo",
                // # of decimal points to convert minimal denomination to user-facing denomination.
                coinDecimals: 6,
                // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
                // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
                // coinGeckoId: ""
            },
            // (Optional) If you have a wallet webpage used to stake the coin then provide the url to the website in `walletUrlForStaking`.
            // The 'stake' button in Keplr extension will link to the webpage.
            // walletUrlForStaking: "",
            // The BIP44 path.
            bip44: {
                // You can only set the coin type of BIP44.
                // 'Purpose' is fixed to 44.
                coinType: 118,
            },
            // Bech32 configuration to show the address to user.
            // This field is the interface of
            // {
            //   bech32PrefixAccAddr: string;
            //   bech32PrefixAccPub: string;
            //   bech32PrefixValAddr: string;
            //   bech32PrefixValPub: string;
            //   bech32PrefixConsAddr: string;
            //   bech32PrefixConsPub: string;
            // }
            bech32Config: {
                bech32PrefixAccAddr: "osmo",
                bech32PrefixAccPub: "osmopub",
                bech32PrefixValAddr: "osmovaloper",
                bech32PrefixValPub: "osmovaloperpub",
                bech32PrefixConsAddr: "osmovalcons",
                bech32PrefixConsPub: "osmovalconspub",
            },
            // List of all coin/tokens used in this chain.
            currencies: [
                {
                    // Coin denomination to be displayed to the user.
                    coinDenom: "OSMO",
                    // Actual denom (i.e. uatom, uscrt) used by the blockchain.
                    coinMinimalDenom: "uosmo",
                    // # of decimal points to convert minimal denomination to user-facing denomination.
                    coinDecimals: 6,
                    // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
                    // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
                    // coinGeckoId: ""
                },
            ],
            // List of coin/tokens used as a fee token in this chain.
            feeCurrencies: [
                {
                    // Coin denomination to be displayed to the user.
                    coinDenom: "OSMO",
                    // Actual denom (i.e. uosmo, uscrt) used by the blockchain.
                    coinMinimalDenom: "uosmo",
                    // # of decimal points to convert minimal denomination to user-facing denomination.
                    coinDecimals: 6,
                    // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
                    // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
                    // coinGeckoId: ""
                },
            ],
            // (Optional) The number of the coin type.
            // This field is only used to fetch the address from ENS.
            // Ideally, it is recommended to be the same with BIP44 path's coin type.
            // However, some early chains may choose to use the Cosmos Hub BIP44 path of '118'.
            // So, this is separated to support such chains.
            coinType: 118,
            // (Optional) This is used to set the fee of the transaction.
            // If this field is not provided, Keplr extension will set the default gas price as (low: 0.01, average: 0.025, high: 0.04).
            // Currently, Keplr doesn't support dynamic calculation of the gas prices based on on-chain data.
            // Make sure that the gas prices are higher than the minimum gas prices accepted by chain validators and RPC/REST endpoint.
            gasPriceStep: {
                low: 0.01,
                average: 0.025,
                high: 0.04,
            },
        };
        let testnetChainInfo2 = {
            chainId: "uni-5",
            chainName: "junotestnet",
            rpc: "https://rpc.uni.junonetwork.io/",
            rest: "https://api.uni.junonetwork.io/",
            stakeCurrency: {
                coinDenom: "JUNO",
                coinMinimalDenom: "ujunox",
                coinDecimals: 6,
            },
            bip44: {
                coinType: 118,
            },
            bech32Config: {
                bech32PrefixAccAddr: "juno",
                bech32PrefixAccPub: "junopub",
                bech32PrefixValAddr: "junovaloper",
                bech32PrefixValPub: "junovaloperpub",
                bech32PrefixConsAddr: "junovalcons",
                bech32PrefixConsPub: "junovalconspub",
            },
            currencies: [
                {
                    coinDenom: "JUNO",
                    coinMinimalDenom: "ujuno",
                    coinDecimals: 6,
                },
            ],
            feeCurrencies: [
                {
                    coinDenom: "JUNO",
                    coinMinimalDenom: "ujuno",
                    coinDecimals: 6,
                },
            ],
            coinType: 118,
            gasPriceStep: {
                low: 0.01,
                average: 0.025,
                high: 0.04,
            },
        };
        yield wallet.experimentalSuggestChain(testnetChainInfo);
        yield wallet.experimentalSuggestChain(testnetChainInfo2);
    });
}
function unlockWallet(wallet) {
    return __awaiter(this, void 0, void 0, function* () {
        yield wallet.enable(testnet_config_json_1.CHAIN_ID);
        yield wallet.enable(CHAIN_ID2);
    });
}
function getSigner(clientStruct) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let { isKeplrType, RPC, wallet, chainId, prefix, seed } = clientStruct;
        let owner;
        let signer;
        if (isKeplrType && wallet !== undefined && chainId !== undefined) {
            signer = (_a = window.getOfflineSigner) === null || _a === void 0 ? void 0 : _a.call(window, chainId);
            owner = (yield wallet.getKey(chainId)).bech32Address;
        }
        else if (!isKeplrType && prefix !== undefined && seed !== undefined) {
            signer = yield proto_signing_1.DirectSecp256k1HdWallet.fromMnemonic(seed, { prefix });
            owner = (yield signer.getAccounts())[0].address;
        }
        else
            throw new Error("Wrong arguments!");
        return { signer, owner, RPC };
    });
}
function getSgClient(clientStruct) {
    return __awaiter(this, void 0, void 0, function* () {
        const { signer, owner, RPC } = yield getSigner(clientStruct);
        if (signer === undefined)
            throw new Error("Signer is undefined!");
        const client = yield stargate_1.SigningStargateClient.connectWithSigner(RPC, signer);
        return { client, owner };
    });
}
exports.getSgClient = getSgClient;
function getCwClient(clientStruct) {
    return __awaiter(this, void 0, void 0, function* () {
        const { signer, owner, RPC } = yield getSigner(clientStruct);
        if (signer === undefined)
            throw new Error("Signer is undefined!");
        const client = yield cosmwasm_stargate_1.SigningCosmWasmClient.connectWithSigner(RPC, signer);
        return { client, owner };
    });
}
exports.getCwClient = getCwClient;
function getAddrByPrefix(address, prefix) {
    return (0, encoding_1.toBech32)(prefix, (0, encoding_1.fromBech32)(address).data);
}
exports.getAddrByPrefix = getAddrByPrefix;
function initWallet() {
    return __awaiter(this, void 0, void 0, function* () {
        let wallet = detectWallet();
        if (wallet === undefined)
            return;
        wallet = wallet;
        yield addChain(wallet); // add network to Keplr
        yield unlockWallet(wallet); // give permission for the webpage to access Keplr
        return wallet;
    });
}
exports.initWallet = initWallet;
