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
exports.updatePoolsAndUsers = exports.getValidators = void 0;
const utils_1 = require("../utils");
const storages_1 = require("../../backend/storages");
const api_helpers_1 = require("../helpers/api-helpers");
let chainRegistryStorage = (0, storages_1.initStorage)("chain-registry-storage");
let ibcChannelsStorage = (0, storages_1.initStorage)("ibc-channels-storage");
let poolsStorage = (0, storages_1.initStorage)("pools-storage");
let validatorsStorage = (0, storages_1.initStorage)("validators-storage");
function getValidators() {
    return __awaiter(this, void 0, void 0, function* () {
        (0, utils_1.l)("getValidators");
        try {
            let res = yield (0, api_helpers_1.getValidators)([
                ["osmosis", "https://osmosis-api.polkachu.com"],
            ]);
            (0, utils_1.l)(res);
        }
        catch (error) {
            (0, utils_1.l)(error, "\n");
        }
    });
}
exports.getValidators = getValidators;
let poolsAndUsers = {
    pools: [
        {
            channel_id: "channel-0",
            denom: "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2",
            id: "1",
            port_id: "transfer",
            price: "13",
            symbol: "uatom",
        },
        {
            channel_id: "channel-42",
            denom: "ibc/46B44899322F3CD854D2D46DEEF881958467CDD4B3B10086DA49296BBED94BED",
            id: "497",
            port_id: "transfer",
            price: "4",
            symbol: "ujuno",
        },
    ],
    users: [
        {
            osmo_address: "osmo12xfuf5yjpcpm5y9wxqxhml7s64d0cfacr4tmeu",
            asset_list: [
                {
                    asset_denom: "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2",
                    wallet_address: "cosmos12xfuf5yjpcpm5y9wxqxhml7s64d0cfactwct0w",
                    wallet_balance: "1",
                },
                {
                    asset_denom: "ibc/46B44899322F3CD854D2D46DEEF881958467CDD4B3B10086DA49296BBED94BED",
                    wallet_address: "juno12xfuf5yjpcpm5y9wxqxhml7s64d0cfacaumsgj",
                    wallet_balance: "2",
                },
            ],
        },
    ],
};
function updatePoolsAndUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        (0, utils_1.l)("updatePoolsAndUsers");
        try {
            let res = yield (0, api_helpers_1.updatePoolsAndUsers)(chainRegistryStorage.get(), poolsAndUsers, poolsStorage.get(), "main");
            (0, utils_1.l)(res);
        }
        catch (error) {
            (0, utils_1.l)(error, "\n");
        }
    });
}
exports.updatePoolsAndUsers = updatePoolsAndUsers;
