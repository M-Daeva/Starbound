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
exports._requestValidators = exports._mockUpdatePoolsAndUsers = exports._updatePoolsAndUsers = void 0;
const utils_1 = require("../utils");
const signers_1 = require("../signers");
const assets_1 = require("../helpers/assets");
const req = (0, utils_1.createRequest)({});
function requestRelayers() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const url = "https://api.mintscan.io/v1/relayer/osmosis-1/paths";
        let data = (yield req.get(url));
        let temp = [];
        for (let item of data.sendable) {
            let { chain_id, paths } = item;
            let maxChannel = {
                symbol: "",
                channel_id: "",
                port_id: "",
                denom: "",
                transfer: 0,
            };
            for (let item of paths) {
                // skip 'transfer/' and 'cw20' denoms
                let targetPath = (_a = item.stats.past.vol.receive) === null || _a === void 0 ? void 0 : _a.find((item) => {
                    let st = item.denom.slice(0, 4);
                    return st !== "tran" && st !== "cw20";
                });
                // if (targetPath !== undefined) l(targetPath);
                let txNum = +item.stats.past.tx_num.transfer;
                if (targetPath !== undefined && txNum > maxChannel.transfer) {
                    let { channel_id, port_id } = item;
                    maxChannel = {
                        symbol: targetPath.denom,
                        channel_id,
                        port_id,
                        denom: "ibc/",
                        transfer: txNum,
                    };
                }
            }
            let { channel_id, port_id, denom, symbol } = maxChannel;
            temp.push({
                symbol,
                chain_id,
                channel_id,
                port_id,
                denom,
            });
        }
        temp = temp.filter(({ channel_id, denom }) => channel_id !== "" && denom !== undefined && denom.slice(0, 3) === "ibc");
        return temp;
    });
}
function requestPools() {
    return __awaiter(this, void 0, void 0, function* () {
        const url = "https://api-osmosis.imperator.co/pools/v2/all?low_liquidity=false";
        // download pools info
        let poolDatabase = yield req.get(url);
        // skip low liquidity pools
        let valid_pools = Object.entries(poolDatabase).filter(([_, [v0]]) => v0.liquidity > 100000);
        return valid_pools;
    });
}
// merge requestRelayers with requestPools to validate asset symbols
function merge() {
    return __awaiter(this, void 0, void 0, function* () {
        let relayers = yield requestRelayers();
        let pools = yield requestPools();
        let temp = [];
        for (let i in pools) {
            const [key, [v0, v1]] = pools[i];
            if (v1.denom !== "uosmo")
                continue;
            for (let relayer of relayers) {
                if (relayer.symbol.slice(1).toUpperCase() === v0.symbol) {
                    temp.push({
                        channel_id: relayer.channel_id,
                        denom: v0.denom,
                        id: key,
                        port_id: relayer.port_id,
                        price: v0.price.toString(),
                        symbol: v0.coingecko_id || v0.symbol,
                    });
                }
            }
        }
        return temp;
    });
}
function _updatePoolsAndUsers(response) {
    return __awaiter(this, void 0, void 0, function* () {
        let { pools, users } = response;
        let poolsData = yield merge();
        for (let pool of pools) {
            for (let poolsDataItem of poolsData) {
                if (pool.denom === poolsDataItem.denom) {
                    pool.price = poolsDataItem.price;
                }
            }
        }
        let osmoAddressList = users.map((user) => user.osmo_address);
        let usersFundsList = yield requestUserFunds(osmoAddressList);
        for (let user of users) {
            for (let asset of user.asset_list) {
                for (let userFunds of usersFundsList) {
                    let [address, { amount }] = userFunds;
                    if (asset.wallet_address === address) {
                        asset.wallet_balance = amount;
                    }
                }
            }
        }
        (0, utils_1.l)({ pools, users: users[0].asset_list });
        return { pools, users };
    });
}
exports._updatePoolsAndUsers = _updatePoolsAndUsers;
function _mockUpdatePoolsAndUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        let data = {
            pools: [
                {
                    id: "1",
                    denom: "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2",
                    price: "11.5",
                    symbol: "uatom",
                    channel_id: "channel-0",
                    port_id: "transfer",
                },
                {
                    id: "497",
                    denom: "ibc/46B44899322F3CD854D2D46DEEF881958467CDD4B3B10086DA49296BBED94BED",
                    price: "3.5",
                    symbol: "ujuno",
                    channel_id: "channel-1110",
                    port_id: "transfer",
                },
                {
                    id: "481",
                    denom: "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F",
                    price: "1",
                    symbol: "debug_ueeur",
                    channel_id: "debug_ch_id",
                    port_id: "transfer",
                },
            ],
            users: [
                {
                    osmo_address: "osmo1gjqnuhv52pd2a7ets2vhw9w9qa9knyhy7y9tgx",
                    asset_list: [
                        {
                            asset_denom: assets_1.DENOMS.ATOM,
                            wallet_address: "cosmos1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyklkm75",
                            wallet_balance: "100",
                        },
                        {
                            asset_denom: assets_1.DENOMS.JUNO,
                            wallet_address: "juno1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyqd4qeg",
                            wallet_balance: "200",
                        },
                    ],
                },
            ],
        };
        return new Promise((res) => res(data));
    });
}
exports._mockUpdatePoolsAndUsers = _mockUpdatePoolsAndUsers;
function getDelegationsUrl(chain, address) {
    let url = `https://api-${chain}-ia.cosmosia.notional.ventures/cosmos/staking/v1beta1/delegations/${address}`;
    return url;
}
function getBalanceUrl(chain, address) {
    let url = `https://api-${chain}-ia.cosmosia.notional.ventures/cosmos/bank/v1beta1/balances/${address}`;
    return url;
}
function requestUserFunds(addresses) {
    return __awaiter(this, void 0, void 0, function* () {
        // request chain list
        let baseUrl = "https://cosmos-chain.directory/chains/";
        let { chains } = yield req.get(baseUrl);
        chains = chains.filter((chain) => chain !== "testnets");
        // iterate over chain list
        let chainPromises = [];
        function requestChain(chain) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    let res = yield req.get(baseUrl + chain);
                    return [chain, res.bech32_prefix];
                }
                catch (error) {
                    return ["", ""];
                }
            });
        }
        for (let chain of chains) {
            chainPromises.push(requestChain(chain));
        }
        let prefixes = yield Promise.all(chainPromises);
        prefixes = prefixes
            .filter(([a, b]) => a !== "" || b !== "")
            .map(([a, b]) => {
            if (a === "likecoin")
                return [a, "like"]; // fix likecoin bench32prefix
            return [a, b];
        });
        // create chain and address list
        let chainAndAddressList = [];
        for (let address of addresses) {
            for (let prefix of prefixes) {
                chainAndAddressList.push([
                    prefix[0],
                    (0, signers_1.getAddrByPrefix)(address, prefix[1]),
                ]);
            }
        }
        // create address and coin list
        let balancePromises = [];
        function requestBalances(chain, address) {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    let balance = yield (yield req.get(getBalanceUrl(chain, address))).json();
                    let delegation = yield (yield req.get(getDelegationsUrl(chain, address))).json();
                    let { denom } = delegation.delegation_responses[0].balance;
                    let balanceHolded = +(((_a = balance.balances.find((coin) => coin.denom === denom)) === null || _a === void 0 ? void 0 : _a.amount) || "0");
                    let balanceStaked = +delegation.delegation_responses[0].balance.amount;
                    let coin = {
                        amount: (balanceHolded + balanceStaked).toString(),
                        denom,
                    };
                    return [address, coin];
                }
                catch (error) {
                    let coin = { amount: "0", denom: "" };
                    return [address, coin];
                }
            });
        }
        for (let [chain, address] of chainAndAddressList) {
            balancePromises.push(requestBalances(chain, address));
        }
        let balanceList = yield Promise.all(balancePromises);
        balanceList = balanceList.filter(([_, { amount }]) => amount !== "0");
        return balanceList;
    });
}
function getValidatorListUrl(chain) {
    let url = `https://api-${chain}-ia.cosmosia.notional.ventures/cosmos/staking/v1beta1/validators?pagination.limit=200&status=BOND_STATUS_BONDED`;
    return url;
}
function _requestValidators() {
    return __awaiter(this, void 0, void 0, function* () {
        // request chain list
        let baseUrl = "https://cosmos-chain.directory/chains/";
        let { chains } = yield req.get(baseUrl);
        chains = chains.filter((chain) => chain !== "testnets");
        let validatorListPromises = [];
        function requestValidatorList(chain) {
            return __awaiter(this, void 0, void 0, function* () {
                let url = getValidatorListUrl(chain);
                try {
                    let res = yield req.get(url);
                    // return [chain, res.validators.length.toString()];
                    return [chain, res.validators.map((item) => item.description.moniker)];
                }
                catch (error) {
                    return [chain, [""]];
                }
            });
        }
        for (let chain of chains) {
            validatorListPromises.push(requestValidatorList(chain));
        }
        let validatorList = yield Promise.all(validatorListPromises);
        validatorList = validatorList.filter(([_, b]) => b[0] !== "");
        return validatorList;
    });
}
exports._requestValidators = _requestValidators;
