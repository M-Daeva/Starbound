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
exports._getChainByChainId = exports.getDappAddressAndDenomList = exports.queryPools = exports.getActiveNetworksInfo = exports.requestRelayers = exports._transformGrantList = exports._getAllGrants = exports._modifyRpcList = exports.getIbcChannelList = exports.getChainNameAndRestList = exports._verifyRestList = exports._verifyRest = exports._verifyRpcList = exports._verifyRpc = exports.mergePools = exports.mergeIbcChannels = exports.mergeChainRegistry = exports.filterChainRegistry = exports.getUserFunds = exports.getValidators = exports.getPools = exports.getIbcChannnels = exports.getChainRegistry = exports.mockUpdatePoolsAndUsers = exports.updatePoolsAndUsers = void 0;
const stargate_1 = require("@cosmjs/stargate");
const assets_1 = require("../helpers/assets");
const signers_1 = require("../signers");
const ibc_config_ab_json_1 = __importDefault(require("../config/ibc-config-ab.json"));
const ibc_config_ac_json_1 = __importDefault(require("../config/ibc-config-ac.json"));
const utils_1 = require("../utils");
const stableDenom = "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F";
const stablePoolId = "481";
const osmoDenom = "uosmo";
const osmoPoolId = "0";
const req = (0, utils_1.createRequest)({});
function _getChainIdbyDenom(chainRegistryStorage, chainType, denom) {
    if (!chainRegistryStorage)
        return;
    const chain = chainRegistryStorage.find(({ denomNative }) => denomNative === denom);
    if (!chain)
        return;
    if (chainType === "main" && chain.main) {
        return chain.main.chain_id;
    }
    if (chainType === "test" && chain.test) {
        return chain.test.chain_id;
    }
    return;
}
function _setPagination(offset, limit) {
    return {
        params: {
            "pagination.offset": offset,
            "pagination.limit": limit,
            "pagination.count_total": true,
        },
    };
}
function getIbcChannelList(chainRegistryStorage, chainType) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        if (!chainRegistryStorage)
            return;
        const chain = chainRegistryStorage.find(({ denomNative }) => denomNative === "uosmo");
        if (!chain)
            return;
        const re = /^transfer\/channel-[0-9]*$/;
        const urlTraces = "/ibc/apps/transfer/v1/denom_traces";
        let rest;
        if (chainType === "main" && chain.main) {
            rest = (_b = (_a = chain.main.apis.rest) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.address;
        }
        if (chainType === "test" && chain.test) {
            rest = (_d = (_c = chain.test.apis.rest) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.address;
        }
        if (!rest)
            return;
        let resTraces;
        try {
            // get ibc channels
            resTraces = yield (0, utils_1.specifyTimeout)(req.get(rest + urlTraces, _setPagination(0, 10000)));
        }
        catch (error) { }
        if (!resTraces)
            return;
        let denomList = chainRegistryStorage.map(({ denomNative }) => denomNative);
        let denomAndChannelIdList = [];
        for (let denom of denomList) {
            // get direct routes
            const tracesByDenom = resTraces.denom_traces.filter(({ base_denom, path }) => base_denom === denom && re.test(path));
            let txAmountAndChannelId = [0, undefined];
            let promises = [];
            // find working channel by amount of txs
            for (let item of tracesByDenom) {
                const [port, channel] = item.path.split("/");
                const fn = () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const resPackets = yield (0, utils_1.specifyTimeout)(req.get(rest +
                            `/ibc/core/channel/v1/channels/${channel}/ports/${port}/packet_acknowledgements`));
                        const txAmount = resPackets.acknowledgements.length;
                        if (txAmount > txAmountAndChannelId[0]) {
                            txAmountAndChannelId = [txAmount, channel];
                        }
                    }
                    catch (error) { }
                });
                promises.push(fn());
            }
            yield Promise.all(promises);
            denomAndChannelIdList.push([denom, txAmountAndChannelId[1]]);
        }
        return denomAndChannelIdList.filter(([denom, channel]) => channel);
    });
}
exports.getIbcChannelList = getIbcChannelList;
// allows to get 1 working rest from chain registry rest list for single network
function _verifyRest(restList) {
    return __awaiter(this, void 0, void 0, function* () {
        let urlList = [];
        for (let rest of restList) {
            // check if we got rest with port
            const restParts = rest.split(":");
            if (restParts.length === 3) {
                rest = `${restParts[0]}:${restParts[1]}`;
            }
            // remove '/' if it's found
            const lastCharIndex = rest.length - 1;
            if (rest.slice(lastCharIndex) === "/") {
                rest = rest.slice(0, lastCharIndex);
            }
            urlList.push(rest);
        }
        let urlAndValidatorsList = []; // url and validator set length
        let promiseList = [];
        for (let urlItem of urlList) {
            // data provided by validators via REST API may differ
            // so we gonna use largest dataset
            const fn = () => __awaiter(this, void 0, void 0, function* () {
                const [a, b] = urlItem.split(":");
                // TODO: write validator set to storage
                const url = `${a}:${b}/cosmos/staking/v1beta1/validators?pagination.limit=200&status=BOND_STATUS_BONDED`;
                try {
                    const res = yield (0, utils_1.specifyTimeout)(req.get(url));
                    urlAndValidatorsList.push([urlItem, res.validators.length]);
                }
                catch (error) { }
            });
            promiseList.push(fn());
        }
        yield Promise.all(promiseList);
        const valSetList = urlAndValidatorsList.map(([a, b]) => b);
        const maxValSetLength = Math.max(...valSetList);
        const [targetUrl, targetValSet] = urlAndValidatorsList.find(([a, b]) => b === maxValSetLength);
        (0, utils_1.l)({ targetUrl, targetValSet });
        return targetUrl;
    });
}
exports._verifyRest = _verifyRest;
// allows to get 1 working rest from chain registry rest list for all networks
function _verifyRestList(prefixAndRestList) {
    return __awaiter(this, void 0, void 0, function* () {
        let resultList = [];
        // for some reasons Promise.all usage leads to data losses
        // so sequential requests must be used here
        for (let [prefix, chainType, restList] of prefixAndRestList) {
            try {
                const restChecked = yield (0, utils_1.specifyTimeout)(_verifyRest(restList), 10000);
                resultList.push([prefix, chainType, restChecked]);
            }
            catch (error) { }
        }
        return resultList;
    });
}
exports._verifyRestList = _verifyRestList;
// allows to get 1 working rpc from chain registry rpc list for single network
function _verifyRpc(rpcList, prefix, seed) {
    return __awaiter(this, void 0, void 0, function* () {
        const portList = ["443", "26657"];
        let urlList = [];
        for (let rpc of rpcList) {
            // check if we got rpc with port
            if (rpc.split(":").length === 3) {
                urlList.push(rpc);
                continue;
            }
            // remove '/' if it's found
            const lastCharIndex = rpc.length - 1;
            if (rpc.slice(lastCharIndex) === "/") {
                rpc = rpc.slice(0, lastCharIndex);
            }
            for (let port of portList) {
                urlList.push(`${rpc}:${port}`);
            }
        }
        let urlChecked;
        for (let url of urlList) {
            const clientStruct = {
                RPC: url,
                prefix,
                seed,
            };
            // query balances to check if url is fine
            try {
                const sgClient = yield (0, signers_1.getSgClient)(clientStruct);
                if (!sgClient)
                    return;
                const { client, owner } = sgClient;
                yield (0, utils_1.specifyTimeout)(client.getAllBalances(owner));
                urlChecked = url;
                break;
            }
            catch (error) {
                // l({ fn: "_verifyRpc", error });
            }
        }
        (0, utils_1.l)({ urlChecked });
        return urlChecked;
    });
}
exports._verifyRpc = _verifyRpc;
// allows to get 1 working rpc from chain registry rpc list for all networks
function _verifyRpcList(prefixAndRpcList, seed) {
    return __awaiter(this, void 0, void 0, function* () {
        let resultList = [];
        // for some reasons Promise.all returns array of undefined
        // so sequential requests must be used here
        for (let [prefix, chainType, rpcList] of prefixAndRpcList) {
            try {
                const rpcChecked = yield _verifyRpc(rpcList, prefix, seed);
                resultList.push([prefix, chainType, rpcChecked]);
            }
            catch (error) {
                // l({ fn: "_verifyRpcList", error });
            }
        }
        return resultList;
    });
}
exports._verifyRpcList = _verifyRpcList;
function _queryMainnetNames() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const mainnetContentResponseList = yield req.get("https://api.github.com/repos/cosmos/chain-registry/contents");
            let names = [];
            for (let { name: rawName } of mainnetContentResponseList) {
                const code = rawName.charCodeAt(0);
                if (!rawName.includes(".") &&
                    rawName !== "testnets" &&
                    code >= 97 &&
                    code < 123) {
                    names.push(rawName);
                }
            }
            return names;
        }
        catch (error) {
            (0, utils_1.l)(error);
            return [];
        }
    });
}
function _queryTestnetNames() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const testnetContentResponseList = yield req.get("https://api.github.com/repos/cosmos/chain-registry/contents/testnets");
            return testnetContentResponseList.map(({ name }) => name);
        }
        catch (error) {
            (0, utils_1.l)(error);
            return [];
        }
    });
}
function _queryNetworkNames() {
    return __awaiter(this, void 0, void 0, function* () {
        const promises = [_queryMainnetNames(), _queryTestnetNames()];
        const [main, test] = yield Promise.all(promises);
        return { main, test };
    });
}
function _mainnetQuerier(chainUrl, assetListUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        let data = {
            prefix: "",
            main: undefined,
            test: undefined,
            img: "",
            symbol: "",
            denomNative: "",
            denomIbc: "",
            exponent: 0,
            coinGeckoId: undefined,
        };
        let promises = [
            req.get(chainUrl),
            req.get(assetListUrl),
        ];
        try {
            let [chainRes, assetListRes] = yield Promise.all(promises);
            let { logo_URIs, symbol, denom_units, coingecko_id } = assetListRes.assets[0];
            let imgUrl = (logo_URIs === null || logo_URIs === void 0 ? void 0 : logo_URIs.svg) || logo_URIs.png;
            let { exponent } = (0, utils_1.getLast)(denom_units);
            let { denom } = denom_units[0];
            data = Object.assign(Object.assign({}, data), { prefix: chainRes.bech32_prefix, main: chainRes, img: imgUrl, symbol, denomNative: denom, exponent, coinGeckoId: coingecko_id });
        }
        catch (error) { }
        return data;
    });
}
function _testnetQuerier(chainUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        let data = {
            prefix: "",
            main: undefined,
            test: undefined,
            img: "",
            symbol: "",
            denomNative: "",
            denomIbc: "",
            exponent: 0,
            coinGeckoId: undefined,
        };
        try {
            let chainRes = yield req.get(chainUrl);
            data = Object.assign(Object.assign({}, data), { prefix: chainRes.bech32_prefix, test: chainRes });
        }
        catch (error) { }
        return data;
    });
}
function _modifyRpcList(prefixAndRpcList, allowList, ignoreList) {
    if (!allowList.length && !ignoreList.length)
        return prefixAndRpcList;
    let temp = [];
    for (let [prefix1, chainType1, rpcList1] of prefixAndRpcList) {
        const allowListItem = allowList.find(([prefix2, chainType2, rpcList2]) => prefix1 === prefix2 && chainType1 === chainType2);
        if (!allowListItem) {
            temp.push([prefix1, chainType1, rpcList1]);
            continue;
        }
        temp.push([
            prefix1,
            chainType1,
            Array.from(new Set([...allowListItem[2], ...rpcList1]).values()),
        ]);
    }
    temp = temp.map(([prefix1, chainType1, rpcList1]) => {
        const ignoreListItem = ignoreList.find(([prefix2, chainType2, rpcList2]) => prefix1 === prefix2 && chainType1 === chainType2);
        if (!ignoreListItem)
            return [prefix1, chainType1, rpcList1];
        let res = [];
        for (let rpc of rpcList1) {
            if (!ignoreListItem[2].includes(rpc)) {
                res.push(rpc);
            }
        }
        return [prefix1, chainType1, res];
    });
    return temp;
}
exports._modifyRpcList = _modifyRpcList;
function _queryNetworksData(mainList, testList, seed, allowList, ignoreList) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        let promises = [];
        for (let chainName of mainList) {
            let chainUrl = `https://raw.githubusercontent.com/cosmos/chain-registry/master/${chainName}/chain.json`;
            let assetListUrl = `https://raw.githubusercontent.com/cosmos/chain-registry/master/${chainName}/assetlist.json`;
            promises.push(_mainnetQuerier(chainUrl, assetListUrl));
        }
        for (let chainName of testList) {
            let chainUrl = `https://raw.githubusercontent.com/cosmos/chain-registry/master/testnets/${chainName}/chain.json`;
            promises.push(_testnetQuerier(chainUrl));
        }
        let rawNetworkData = yield Promise.all(promises);
        // remove terra chain duplication
        rawNetworkData = rawNetworkData.filter(({ symbol }) => symbol !== "LUNC");
        let networkData = rawNetworkData.filter((item) => item.main);
        let testnetData = rawNetworkData.filter((item) => item.test);
        for (let networkDataItem of networkData) {
            for (let testnetDataItem of testnetData) {
                if (networkDataItem.prefix === testnetDataItem.prefix) {
                    networkDataItem.test = testnetDataItem.test;
                }
            }
        }
        // update rpc and rest lists with their verified versions
        let prefixAndRpcList = [];
        let prefixAndRestList = [];
        for (let { prefix, main, test } of networkData) {
            if (main) {
                const chainType = "main";
                const rpcList = (((_a = main === null || main === void 0 ? void 0 : main.apis) === null || _a === void 0 ? void 0 : _a.rpc) || []).map(({ address }) => address);
                const restList = (((_b = main === null || main === void 0 ? void 0 : main.apis) === null || _b === void 0 ? void 0 : _b.rest) || []).map(({ address }) => address);
                prefixAndRpcList.push([prefix, chainType, rpcList]);
                prefixAndRestList.push([prefix, chainType, restList]);
            }
            if (test) {
                const chainType = "test";
                const rpcList = (((_c = test === null || test === void 0 ? void 0 : test.apis) === null || _c === void 0 ? void 0 : _c.rpc) || []).map(({ address }) => address);
                const restList = (((_d = test === null || test === void 0 ? void 0 : test.apis) === null || _d === void 0 ? void 0 : _d.rest) || []).map(({ address }) => address);
                prefixAndRpcList.push([prefix, chainType, rpcList]);
                prefixAndRestList.push([prefix, chainType, restList]);
            }
        }
        const [prefixAndRpcChecked, prefixAndRestChecked] = yield Promise.all([
            _verifyRpcList(_modifyRpcList(prefixAndRpcList, allowList, ignoreList), seed),
            _verifyRestList(prefixAndRestList),
        ]);
        let networkDataChecked = [];
        for (let networkDataItem of networkData) {
            const { prefix, main, test } = networkDataItem;
            const provider = "Starbound";
            let mainChecked = main;
            let testChecked = test;
            const rpcListChecked = prefixAndRpcChecked.filter(([p]) => p === prefix);
            const restListChecked = prefixAndRestChecked.filter(([p]) => p === prefix);
            if (main) {
                const chainType = "main";
                const rpcMain = rpcListChecked.find(([p, c]) => c === chainType);
                const restMain = restListChecked.find(([p, c]) => c === chainType);
                const rpcAddress = rpcMain === null || rpcMain === void 0 ? void 0 : rpcMain[2];
                const rpcMainChecked = rpcAddress
                    ? [{ address: rpcAddress, provider }]
                    : [];
                const restAddress = restMain === null || restMain === void 0 ? void 0 : restMain[2];
                const restMainChecked = restAddress
                    ? [{ address: restAddress, provider }]
                    : [];
                const { apis } = main;
                mainChecked = Object.assign(Object.assign({}, main), { apis: Object.assign(Object.assign({}, apis), { rpc: rpcMainChecked, rest: restMainChecked }) });
            }
            if (test) {
                const chainType = "test";
                const rpcTest = rpcListChecked.find(([p, c]) => c === chainType);
                const restTest = restListChecked.find(([p, c]) => c === chainType);
                const rpcAddress = rpcTest === null || rpcTest === void 0 ? void 0 : rpcTest[2];
                const rpcTestChecked = rpcAddress
                    ? [{ address: rpcAddress, provider }]
                    : [];
                const restAddress = restTest === null || restTest === void 0 ? void 0 : restTest[2];
                const restTestChecked = restAddress
                    ? [{ address: restAddress, provider }]
                    : [];
                const { apis } = test;
                testChecked = Object.assign(Object.assign({}, test), { apis: Object.assign(Object.assign({}, apis), { rpc: rpcTestChecked, rest: restTestChecked }) });
            }
            networkDataChecked.push(Object.assign(Object.assign({}, networkDataItem), { main: mainChecked, test: testChecked }));
        }
        return networkDataChecked;
    });
}
function getChainRegistry(seed, allowList, ignoreList) {
    return __awaiter(this, void 0, void 0, function* () {
        const { main, test } = yield _queryNetworkNames();
        return yield _queryNetworksData(main, test, seed, allowList, ignoreList);
    });
}
exports.getChainRegistry = getChainRegistry;
function mergeChainRegistry(chainRegistryStorage, chainRegistryResponse) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    if (!chainRegistryStorage)
        return chainRegistryResponse;
    let result = [];
    // find intersection of old and new lists
    // and update rpc and rest if it's needed
    for (let resItem of chainRegistryResponse) {
        for (let storageItem of chainRegistryStorage) {
            if (resItem.prefix === storageItem.prefix) {
                const resMainRpc = ((_b = (_a = resItem.main) === null || _a === void 0 ? void 0 : _a.apis) === null || _b === void 0 ? void 0 : _b.rpc) || [];
                const resMainRest = ((_d = (_c = resItem.main) === null || _c === void 0 ? void 0 : _c.apis) === null || _d === void 0 ? void 0 : _d.rest) || [];
                const resMainRpcLen = resMainRpc.length;
                const resMainRestLen = resMainRest.length;
                const resTestRpc = ((_f = (_e = resItem.test) === null || _e === void 0 ? void 0 : _e.apis) === null || _f === void 0 ? void 0 : _f.rpc) || [];
                const resTestRest = ((_h = (_g = resItem.test) === null || _g === void 0 ? void 0 : _g.apis) === null || _h === void 0 ? void 0 : _h.rest) || [];
                const resTestRpcLen = resTestRpc.length;
                const resTestRestLen = resTestRest.length;
                let storMainRpc = ((_k = (_j = storageItem.main) === null || _j === void 0 ? void 0 : _j.apis) === null || _k === void 0 ? void 0 : _k.rpc) || [];
                let storMainRest = ((_m = (_l = storageItem.main) === null || _l === void 0 ? void 0 : _l.apis) === null || _m === void 0 ? void 0 : _m.rest) || [];
                const storMainRpcLen = storMainRpc.length;
                const storMainRestLen = storMainRest.length;
                let storTestRpc = ((_p = (_o = storageItem.test) === null || _o === void 0 ? void 0 : _o.apis) === null || _p === void 0 ? void 0 : _p.rpc) || [];
                let storTestRest = ((_r = (_q = storageItem.test) === null || _q === void 0 ? void 0 : _q.apis) === null || _r === void 0 ? void 0 : _r.rest) || [];
                const storTestRpcLen = storTestRpc.length;
                const storTestRestLen = storTestRest.length;
                // doesn't update if operating adresses are not received
                if (resMainRpcLen >= storMainRpcLen)
                    storMainRpc = resMainRpc;
                if (resMainRestLen >= storMainRestLen)
                    storMainRest = resMainRest;
                if (resTestRpcLen >= storTestRpcLen)
                    storTestRpc = resTestRpc;
                if (resTestRestLen >= storTestRestLen)
                    storTestRest = resTestRest;
                let temp = resItem;
                if (temp.main) {
                    const { main } = temp;
                    const { apis } = main;
                    temp = Object.assign(Object.assign({}, temp), { main: Object.assign(Object.assign({}, main), { apis: Object.assign(Object.assign({}, apis), { rpc: storMainRpc, rest: storMainRest }) }) });
                }
                if (temp.test) {
                    const { test } = temp;
                    const { apis } = test;
                    temp = Object.assign(Object.assign({}, temp), { test: Object.assign(Object.assign({}, test), { apis: Object.assign(Object.assign({}, apis), { rpc: storTestRpc, rest: storTestRest }) }) });
                }
                result.push(temp);
            }
        }
    }
    // add unchanged old items
    for (let storItem of chainRegistryStorage) {
        if (!result.map(({ prefix }) => prefix).includes(storItem.prefix)) {
            result.push(storItem);
        }
    }
    // add new items
    for (let resItem of chainRegistryResponse) {
        if (!result.map(({ prefix }) => prefix).includes(resItem.prefix)) {
            result.push(resItem);
        }
    }
    return result;
}
exports.mergeChainRegistry = mergeChainRegistry;
function mergeIbcChannels(ibcChannelsStorage, ibcChannelsResponse) {
    if (!ibcChannelsStorage || !ibcChannelsResponse)
        return ibcChannelsResponse;
    for (let resItem of ibcChannelsResponse) {
        // replace item if it's found in storage or add a new
        ibcChannelsStorage = [
            ...ibcChannelsStorage.filter(({ destination }) => destination !== resItem.destination),
            resItem,
        ];
    }
    return ibcChannelsStorage;
}
exports.mergeIbcChannels = mergeIbcChannels;
function mergePools(poolsStorage, poolsResponse) {
    if (!poolsStorage)
        return poolsResponse;
    for (let resItem of poolsResponse) {
        // replace item if it's found in storage or add a new
        poolsStorage = [
            ...poolsStorage.filter(([k, v]) => k !== resItem[0]),
            resItem,
        ];
    }
    return poolsStorage;
}
exports.mergePools = mergePools;
function getIbcChannnels(chainRegistryStorage, chainType) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        if (!chainRegistryStorage)
            return;
        const pools = yield getPools();
        let IbcResponseList = [];
        for (const [key, [v0, v1]] of pools) {
            if (v1.denom !== "uosmo")
                continue;
            const chain = chainRegistryStorage.find(({ symbol }) => symbol === v0.symbol);
            if (!chain)
                continue;
            // if testnet skip unused chains
            let a_channel_id = "";
            let a_port_id = "";
            if (chainType === "test") {
                if (((_a = chain.test) === null || _a === void 0 ? void 0 : _a.chain_id) !== ibc_config_ab_json_1.default.b_chain_id &&
                    ((_b = chain.test) === null || _b === void 0 ? void 0 : _b.chain_id) !== ibc_config_ac_json_1.default.b_chain_id) {
                    continue;
                }
                ({ a_channel_id, a_port_id } =
                    chain.test.chain_id === ibc_config_ab_json_1.default.b_chain_id
                        ? ibc_config_ab_json_1.default
                        : ibc_config_ac_json_1.default);
            }
            const { denomNative } = chain;
            const port_id = chainType === "main" ? "transfer" : a_port_id;
            const denomIbc = chainType === "main"
                ? v0.denom
                : (0, utils_1.getIbcDenom)(a_channel_id, `${port_id}/${(0, utils_1.getChannelId)(denomNative, v0.denom, port_id)}/${denomNative}`, port_id);
            const channel_id = chainType === "main"
                ? (0, utils_1.getChannelId)(denomNative, denomIbc)
                : a_channel_id;
            if (!channel_id)
                continue;
            const destination = chainType === "main" ? (_c = chain.main) === null || _c === void 0 ? void 0 : _c.chain_id : (_d = chain.test) === null || _d === void 0 ? void 0 : _d.chain_id;
            if (!destination)
                continue;
            IbcResponseList.push({
                source: chainType === "main" ? "osmosis-1" : "osmo-test-4",
                destination,
                channel_id,
                token_symbol: "OSMO",
                token_name: "Osmosis",
                token_liquidity: 0,
                last_tx: "",
                size_queue: 0,
                duration_minutes: 0,
            });
        }
        return IbcResponseList;
    });
}
exports.getIbcChannnels = getIbcChannnels;
function requestRelayers(chainRegistryStorage, chainType) {
    return __awaiter(this, void 0, void 0, function* () {
        let relayerStructList = [];
        let ibcResponseList; // from osmo channels only
        let poolList = [];
        yield Promise.all([
            (() => __awaiter(this, void 0, void 0, function* () {
                try {
                    ibcResponseList = yield getIbcChannnels(chainRegistryStorage, chainType);
                }
                catch (error) { }
            }))(),
            (() => __awaiter(this, void 0, void 0, function* () {
                try {
                    poolList = yield getPools();
                }
                catch (error) { }
            }))(),
        ]);
        if (!ibcResponseList)
            return;
        for (const { destination: chain_id, channel_id } of ibcResponseList) {
            let chain;
            if (chainType === "main") {
                chain = chainRegistryStorage === null || chainRegistryStorage === void 0 ? void 0 : chainRegistryStorage.find((item) => { var _a; return ((_a = item.main) === null || _a === void 0 ? void 0 : _a.chain_id) === chain_id; });
            }
            if (chainType === "test") {
                chain = chainRegistryStorage === null || chainRegistryStorage === void 0 ? void 0 : chainRegistryStorage.find((item) => { var _a; return ((_a = item.test) === null || _a === void 0 ? void 0 : _a.chain_id) === chain_id; });
            }
            if (!chain)
                continue;
            const pool = poolList.find(([k, [{ symbol, denom }, v1]]) => symbol === (chain === null || chain === void 0 ? void 0 : chain.symbol));
            if (!pool)
                continue;
            const [k, [{ symbol, denom }, v1]] = pool;
            relayerStructList.push({
                chain_id,
                channel_id,
                port_id: "transfer",
                denom,
                symbol,
            });
        }
        return relayerStructList;
    });
}
exports.requestRelayers = requestRelayers;
function getPools() {
    return __awaiter(this, void 0, void 0, function* () {
        const url = "https://api-osmosis.imperator.co/pools/v2/all?low_liquidity=false";
        // download pools info
        let poolDatabase = yield req.get(url);
        // skip low liquidity pools
        let valid_pools = Object.entries(poolDatabase).filter(([_, [v0]]) => v0.liquidity > 1000);
        return valid_pools;
    });
}
exports.getPools = getPools;
function filterChainRegistry(chainRegistry, ibcChannels, pools, validators, chainType) {
    if (!chainRegistry || !ibcChannels || !pools || !validators) {
        return {
            chainRegistry: chainRegistry || [],
            ibcChannels: ibcChannels || [],
            pools: pools || [],
            activeNetworks: [],
        };
    }
    const ibcChannelDestinations = ibcChannels.map(({ destination }) => destination);
    const osmoPools = pools.filter(([k, [v1, v2]]) => v2.symbol === "OSMO");
    const poolSymbols = osmoPools.map(([k, [v1, v2]]) => v1.symbol);
    const validatorsChains = validators.map((item) => item[0]);
    let chainRegistryFiltered = [];
    if (chainType === "main") {
        chainRegistryFiltered = chainRegistry.filter(({ symbol, main }) => {
            if (!main)
                return false;
            return (ibcChannelDestinations.includes(main.chain_id) &&
                poolSymbols.includes(symbol) &&
                validatorsChains.includes(main.chain_name));
        });
    }
    else {
        chainRegistryFiltered = chainRegistry.filter(({ symbol, test }) => {
            if (!test)
                return false;
            return (ibcChannelDestinations.includes(test.chain_id) &&
                poolSymbols.includes(symbol) &&
                validatorsChains.includes(test.chain_name));
        });
    }
    const osmoChainRegistry = chainRegistry.find(({ symbol }) => symbol === "OSMO");
    if (typeof osmoChainRegistry !== "undefined") {
        chainRegistryFiltered.push(osmoChainRegistry);
    }
    chainRegistryFiltered = chainRegistryFiltered.sort((a, b) => a.symbol > b.symbol ? 1 : -1);
    const chainRegistryFilteredSymbols = chainRegistryFiltered.map(({ symbol }) => symbol);
    let chainRegistryFilteredDestinations = [];
    if (chainType === "main") {
        chainRegistryFilteredDestinations = chainRegistryFiltered.map(({ main }) => {
            if (!main)
                return "";
            return main.chain_id;
        });
    }
    else {
        chainRegistryFilteredDestinations = chainRegistryFiltered.map(({ test }) => {
            if (!test)
                return "";
            return test.chain_id;
        });
    }
    const ibcChannelsFiltered = ibcChannels.filter(({ destination }) => chainRegistryFilteredDestinations.includes(destination));
    const poolsFiltered = osmoPools.filter(([k, [v1, v2]]) => chainRegistryFilteredSymbols.includes(v1.symbol));
    let activeNetworks = [];
    for (let chainRegistry of chainRegistryFiltered) {
        let ibcChannel;
        let denom;
        let id;
        let price;
        if (chainType === "main") {
            const { main } = chainRegistry;
            if (!main)
                continue;
            const pool = poolsFiltered.find(([k, [v1, v2]]) => v1.symbol === chainRegistry.symbol);
            if (!pool)
                continue;
            [id, [{ denom, price }]] = pool;
            ibcChannel = ibcChannelsFiltered.find(({ destination }) => destination === main.chain_id);
        }
        else {
            const { test } = chainRegistry;
            if (!test)
                continue;
            const pool = poolsFiltered.find(([k, [v1, v2]]) => v1.symbol === chainRegistry.symbol);
            if (!pool)
                continue;
            [id, [{ denom, price }]] = pool;
            ibcChannel = ibcChannelsFiltered.find(({ destination }) => destination === test.chain_id);
        }
        if (!ibcChannel)
            continue;
        activeNetworks.push({
            channel_id: ibcChannel.channel_id,
            denom,
            id,
            port_id: "transfer",
            price: price.toString(),
            symbol: chainRegistry.symbol,
        });
    }
    // add osmo network
    const priceList = osmoPools.map(([id, [assetFirst, assetOsmo]]) => assetOsmo.price);
    const mean = priceList.reduce((acc, cur) => acc + cur, 0) / priceList.length;
    activeNetworks.push({
        channel_id: "",
        denom: "uosmo",
        id: "0",
        port_id: "",
        price: mean.toString(),
        symbol: "",
    });
    chainRegistryFiltered = chainRegistryFiltered.map((item) => {
        const pool = poolsFiltered.find(([k, [v0, v1]]) => v0.symbol === item.symbol);
        if (!pool)
            return item;
        const [k, [v0, v1]] = pool;
        return Object.assign(Object.assign({}, item), { denomIbc: v0.denom });
    });
    return {
        chainRegistry: chainRegistryFiltered,
        ibcChannels: ibcChannelsFiltered,
        pools: poolsFiltered,
        activeNetworks,
    };
}
exports.filterChainRegistry = filterChainRegistry;
function _getChainByChainId(chainRegistryStorage, chainId) {
    if (!chainRegistryStorage)
        return;
    const mainnet = chainRegistryStorage.find((item) => { var _a; return ((_a = item.main) === null || _a === void 0 ? void 0 : _a.chain_id) === chainId; });
    const testnet = chainRegistryStorage.find((item) => { var _a; return ((_a = item.test) === null || _a === void 0 ? void 0 : _a.chain_id) === chainId; });
    return testnet || mainnet;
}
exports._getChainByChainId = _getChainByChainId;
// TODO: remove requestRelayers -> getIbcChannnels -> getIbcChannelList
// merge requestRelayers with requestPools to validate asset symbols
// and filter IBC active networks
function getActiveNetworksInfo(chainRegistryStorage, chainType) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        if (!chainRegistryStorage)
            return;
        const pools = yield getPools();
        let temp = [];
        for (const [key, [v0, v1]] of pools) {
            if (v1.denom !== "uosmo")
                continue;
            const chain = chainRegistryStorage.find(({ symbol }) => symbol === v0.symbol);
            if (!chain)
                continue;
            // if testnet skip unused chains
            let a_channel_id = "";
            let a_port_id = "";
            if (chainType === "test") {
                if (((_a = chain.test) === null || _a === void 0 ? void 0 : _a.chain_id) !== ibc_config_ab_json_1.default.b_chain_id &&
                    ((_b = chain.test) === null || _b === void 0 ? void 0 : _b.chain_id) !== ibc_config_ac_json_1.default.b_chain_id) {
                    continue;
                }
                ({ a_channel_id, a_port_id } =
                    chain.test.chain_id === ibc_config_ab_json_1.default.b_chain_id
                        ? ibc_config_ab_json_1.default
                        : ibc_config_ac_json_1.default);
            }
            const { denomNative, symbol } = chain;
            const port_id = chainType === "main" ? "transfer" : a_port_id;
            // provided only to get channel_id
            const denomIbc = chainType === "main"
                ? v0.denom
                : (0, utils_1.getIbcDenom)(a_channel_id, `${port_id}/${(0, utils_1.getChannelId)(denomNative, v0.denom, port_id)}/${denomNative}`, port_id);
            const channel_id = chainType === "main"
                ? (0, utils_1.getChannelId)(denomNative, denomIbc)
                : a_channel_id;
            if (!channel_id)
                continue;
            temp.push({
                channel_id,
                denom: v0.denom,
                id: key,
                port_id,
                price: v0.price.toString(),
                symbol,
            });
        }
        return temp;
    });
}
exports.getActiveNetworksInfo = getActiveNetworksInfo;
function updatePoolsAndUsers(chainRegistryResponse, queryPoolsAndUsersResponse, poolsStorage, chainType) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (!queryPoolsAndUsersResponse || !chainRegistryResponse)
            return queryPoolsAndUsersResponse;
        let { pools, users } = queryPoolsAndUsersResponse;
        let poolsData = yield getActiveNetworksInfo(chainRegistryResponse, chainType);
        if (!poolsData)
            return;
        // update existing pools
        for (let poolsDataItem of poolsData) {
            // replace item if it's found in storage or add a new
            pools = [
                ...pools.filter((pool) => pool.symbol !== poolsDataItem.symbol),
                poolsDataItem,
            ];
        }
        // update stablecoin pool
        const stablePool = {
            id: stablePoolId,
            denom: stableDenom,
            price: "1",
            symbol: "",
            channel_id: "",
            port_id: "",
        };
        // add virtual osmo/osmo pool
        const osmoPool = {
            id: osmoPoolId,
            denom: osmoDenom,
            price: "0.8",
            symbol: "",
            channel_id: "",
            port_id: "",
        };
        pools = [
            ...pools.filter(({ denom }) => denom !== stablePool.denom && denom !== osmoPool.denom),
            stablePool,
            osmoPool,
        ];
        let usersFundsList = yield getUserFunds(chainRegistryResponse, queryPoolsAndUsersResponse, poolsStorage, chainType);
        for (let user of users) {
            for (let asset of user.asset_list) {
                for (let userFunds of usersFundsList) {
                    let { address, holded, staked } = userFunds;
                    if (asset.wallet_address === address) {
                        asset.wallet_balance = (+holded.amount + +staked.amount).toString();
                    }
                }
            }
        }
        (0, utils_1.l)({ fn: "updatePoolsAndUsers", pools, assetList: (_a = users === null || users === void 0 ? void 0 : users[0]) === null || _a === void 0 ? void 0 : _a.asset_list });
        return { pools, users };
    });
}
exports.updatePoolsAndUsers = updatePoolsAndUsers;
function mockUpdatePoolsAndUsers() {
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
exports.mockUpdatePoolsAndUsers = mockUpdatePoolsAndUsers;
function _getValidators(rest) {
    return __awaiter(this, void 0, void 0, function* () {
        const [a, b] = rest.split(":");
        const url = `${a}:${b}/cosmos/staking/v1beta1/validators?pagination.limit=200&status=BOND_STATUS_BONDED`;
        try {
            const res = yield req.get(url);
            return res.validators
                .filter(({ jailed }) => !jailed)
                .map(({ operator_address, description: { moniker } }) => ({
                operator_address,
                moniker: moniker.trim(),
            }));
        }
        catch (error) {
            return [];
        }
    });
}
function getValidators(cnainNameAndRestList) {
    return __awaiter(this, void 0, void 0, function* () {
        let validatorList = [];
        let promiseList = [];
        for (let [cnainName, rest] of cnainNameAndRestList) {
            const fn = () => __awaiter(this, void 0, void 0, function* () {
                validatorList.push([cnainName, yield _getValidators(rest)]);
            });
            promiseList.push(fn());
        }
        yield Promise.all(promiseList);
        return validatorList;
    });
}
exports.getValidators = getValidators;
function getChainNameAndRestList(chainRegistryStorage, chainType) {
    var _a, _b;
    if (!chainRegistryStorage)
        return [];
    let chainNameAndRestList = [];
    for (let { main, test } of chainRegistryStorage) {
        if (chainType === "main" && main) {
            const rest = ((_a = main === null || main === void 0 ? void 0 : main.apis) === null || _a === void 0 ? void 0 : _a.rest) || [];
            if (!rest.length) {
                continue;
            }
            chainNameAndRestList.push([main.chain_name, rest[0].address]);
        }
        if (chainType === "test" && test) {
            const rest = ((_b = test === null || test === void 0 ? void 0 : test.apis) === null || _b === void 0 ? void 0 : _b.rest) || [];
            if (!rest.length) {
                continue;
            }
            chainNameAndRestList.push([test.chain_name, rest[0].address]);
        }
    }
    return chainNameAndRestList;
}
exports.getChainNameAndRestList = getChainNameAndRestList;
function getUserFunds(chainRegistryResponse, queryPoolsAndUsersResponse, poolsStorage, chainType) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return __awaiter(this, void 0, void 0, function* () {
        if (!chainRegistryResponse || !queryPoolsAndUsersResponse || !poolsStorage) {
            return [];
        }
        // assign ibc denoms
        chainRegistryResponse = chainRegistryResponse.map((item) => {
            const { symbol } = item;
            const pool = poolsStorage.find(([key, [v0, v1]]) => v0.symbol === symbol);
            if (!pool)
                return item;
            const [key, [v0, v1]] = pool;
            return Object.assign(Object.assign({}, item), { denomIbc: v0.denom });
        });
        let resList = [];
        let promiseList = [];
        for (let user of queryPoolsAndUsersResponse.users) {
            for (let asset of user.asset_list) {
                const chain = chainRegistryResponse.find(({ prefix }) => prefix === asset.wallet_address.split("1")[0]);
                if (!chain)
                    continue;
                const { denomNative } = chain;
                if (chainType === "main" && chain.main) {
                    const rest = (_d = (_c = (_b = (_a = chain.main) === null || _a === void 0 ? void 0 : _a.apis) === null || _b === void 0 ? void 0 : _b.rest) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.address;
                    if (rest) {
                        const urlHolded = `${rest}/cosmos/bank/v1beta1/balances/${asset.wallet_address}`;
                        const urlStaked = `${rest}/cosmos/staking/v1beta1/delegations/${asset.wallet_address}`;
                        const fn = () => __awaiter(this, void 0, void 0, function* () {
                            var _j, _k, _l;
                            try {
                                const balHolded = yield req.get(urlHolded);
                                const balStaked = yield req.get(urlStaked);
                                const amountHolded = ((_j = balHolded.balances.find(({ denom }) => denom === denomNative)) === null || _j === void 0 ? void 0 : _j.amount) || "0";
                                const amountStaked = ((_k = balStaked.delegation_responses.find(({ balance: { denom } }) => denom === denomNative)) === null || _k === void 0 ? void 0 : _k.balance.amount) || "0";
                                resList.push({
                                    address: asset.wallet_address,
                                    osmoAddr: user.osmo_address,
                                    chain: (_l = chain.main) === null || _l === void 0 ? void 0 : _l.chain_name,
                                    holded: (0, stargate_1.coin)(amountHolded, denomNative),
                                    staked: (0, stargate_1.coin)(amountStaked, denomNative),
                                });
                            }
                            catch (error) { }
                        });
                        promiseList.push(fn());
                    }
                }
                if (chainType === "test" && chain.test) {
                    const rest = (_h = (_g = (_f = (_e = chain.test) === null || _e === void 0 ? void 0 : _e.apis) === null || _f === void 0 ? void 0 : _f.rest) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.address;
                    if (rest) {
                        const urlHolded = `${rest}/cosmos/bank/v1beta1/balances/${asset.wallet_address}`;
                        const urlStaked = `${rest}/cosmos/staking/v1beta1/delegations/${asset.wallet_address}`;
                        const ibcConfigList = [
                            (0, utils_1.getIbcDenom)(ibc_config_ab_json_1.default.b_channel_id, `${ibc_config_ab_json_1.default.a_port_id}/${(0, utils_1.getChannelId)(denomNative, chain.denomIbc, ibc_config_ab_json_1.default.a_port_id)}/${denomNative}`, ibc_config_ab_json_1.default.a_port_id),
                            (0, utils_1.getIbcDenom)(ibc_config_ac_json_1.default.b_channel_id, `${ibc_config_ac_json_1.default.a_port_id}/${(0, utils_1.getChannelId)(denomNative, chain.denomIbc, ibc_config_ac_json_1.default.a_port_id)}/${denomNative}`, ibc_config_ac_json_1.default.a_port_id),
                        ];
                        const fn = () => __awaiter(this, void 0, void 0, function* () {
                            var _m, _o, _p;
                            try {
                                const balHolded = yield req.get(urlHolded);
                                const balStaked = yield req.get(urlStaked);
                                const amountHolded = ((_m = balHolded.balances.find(({ denom }) => {
                                    if (denom === "ujunox") {
                                        return (chain.denomNative ===
                                            (0, utils_1.getIbcDenom)(ibc_config_ab_json_1.default.a_channel_id, "transfer/channel-42/ujuno", ibc_config_ab_json_1.default.a_port_id) ||
                                            chain.denomNative ===
                                                (0, utils_1.getIbcDenom)(ibc_config_ac_json_1.default.a_channel_id, "transfer/channel-42/ujuno", ibc_config_ac_json_1.default.a_port_id));
                                    }
                                    else {
                                        return ibcConfigList.includes(denom);
                                    }
                                })) === null || _m === void 0 ? void 0 : _m.amount) || "0";
                                const amountStaked = ((_o = balStaked.delegation_responses.find(({ balance: { denom } }) => {
                                    if (denom === "ujunox") {
                                        return denomNative === "ujuno";
                                    }
                                    else {
                                        return denom === denomNative;
                                    }
                                })) === null || _o === void 0 ? void 0 : _o.balance.amount) || "0";
                                resList.push({
                                    address: asset.wallet_address,
                                    osmoAddr: user.osmo_address,
                                    chain: (_p = chain.test) === null || _p === void 0 ? void 0 : _p.chain_name,
                                    holded: (0, stargate_1.coin)(amountHolded, denomNative),
                                    staked: (0, stargate_1.coin)(amountStaked, denomNative),
                                });
                            }
                            catch (error) { }
                        });
                        promiseList.push(fn());
                    }
                }
            }
        }
        yield Promise.all(promiseList);
        return resList;
    });
}
exports.getUserFunds = getUserFunds;
// returns [denom, [granter, valoper][]][] for specified grantee on all chains
function _getAllGrants(grantee, chainRegistryResponse, chainType) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return __awaiter(this, void 0, void 0, function* () {
        if (!chainRegistryResponse)
            return;
        let denomGranterValoperList = [];
        let promiseList = [];
        for (let chain of chainRegistryResponse) {
            let rest;
            if (chainType === "main" && chain.main) {
                rest = (_d = (_c = (_b = (_a = chain.main) === null || _a === void 0 ? void 0 : _a.apis) === null || _b === void 0 ? void 0 : _b.rest) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.address;
            }
            if (chainType === "test" && chain.test) {
                rest = (_h = (_g = (_f = (_e = chain.test) === null || _e === void 0 ? void 0 : _e.apis) === null || _f === void 0 ? void 0 : _f.rest) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.address;
            }
            if (!rest)
                continue;
            const urlGrants = `${rest}/cosmos/authz/v1beta1/grants/grantee/${(0, signers_1.getAddrByPrefix)(grantee, chain.prefix)}`;
            const fn = () => __awaiter(this, void 0, void 0, function* () {
                try {
                    const res = yield req.get(urlGrants);
                    const granterAndValoperList = res.grants.map(({ granter, authorization: { allow_list } }) => [
                        granter,
                        allow_list.address[0],
                    ]);
                    denomGranterValoperList.push([
                        chain.denomNative,
                        granterAndValoperList,
                    ]);
                }
                catch (error) { }
            });
            promiseList.push(fn());
        }
        yield Promise.all(promiseList);
        return denomGranterValoperList.filter(([chain, list]) => list.length);
    });
}
exports._getAllGrants = _getAllGrants;
// transforms [denom, [granter, valoper][]][] -> [[denom, granter, valoper][]][]
// to provide async signing txs on different chains
function _transformGrantList(denomGranterValoperList) {
    let res = [];
    for (const [denom, granterValoperList] of denomGranterValoperList) {
        for (let i in granterValoperList) {
            const [granter, valoper] = granterValoperList[i];
            res[i] = [...(res[i] || []), [denom, granter, valoper]];
        }
    }
    return res;
}
exports._transformGrantList = _transformGrantList;
function queryPools(chainRegistry) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (!chainRegistry)
            return;
        const chain = chainRegistry.find((item) => item.prefix === "osmo");
        if (!chain)
            return;
        const rest = (_a = chain.test) === null || _a === void 0 ? void 0 : _a.apis.rest[0].address;
        if (!rest)
            return;
        const url = `${rest}/osmosis/gamm/v1beta1/pools`;
        const res = yield req.get(url, _setPagination(10, 100));
        return res;
    });
}
exports.queryPools = queryPools;
function getDappAddressAndDenomList(osmoAddress, chainRegistry) {
    if (!chainRegistry)
        return;
    let dappAddressAndDenomList = [];
    for (let { denomIbc, prefix } of chainRegistry) {
        if (prefix === "osmo")
            denomIbc = "uosmo";
        dappAddressAndDenomList.push([
            (0, signers_1.getAddrByPrefix)(osmoAddress, prefix),
            denomIbc,
        ]);
    }
    return dappAddressAndDenomList;
}
exports.getDappAddressAndDenomList = getDappAddressAndDenomList;
