import { Coin, coin } from "@cosmjs/stargate";
import { getAddrByPrefix } from "../../common/account/clients";
import { getSgQueryHelpers } from "../../common/account/sg-helpers";
import Decimal from "decimal.js";
import ibcConfigAb from "../../common/config/ibc-config-ab.json";
import ibcConfigAc from "../../common/config/ibc-config-ac.json";
import { DAPP_ADDRESS } from "../envs";
import {
  PoolExtracted,
  QueryPoolsAndUsersResponse,
} from "../../common/codegen/StarboundOsmosis.types";
import {
  Request,
  l,
  getLast,
  specifyTimeout as _specifyTimeout,
  getChannelId as _getChannelId,
  getIbcDenom as _getIbcDenom,
} from "../../common/utils";
import {
  RelayerStruct,
  PoolDatabase,
  ChainsResponse,
  ChainResponse,
  BalancesResponse,
  DelegationsResponse,
  ValidatorListResponse,
  ValidatorResponse,
  ValidatorResponseReduced,
  IbcResponse,
  NetworkData,
  AssetList,
  AssetDescription,
  NetworkContentResponse,
  ChainRegistryStorage,
  IbcChannelsStorage,
  PoolsStorage,
  PoolsAndUsersStorage,
  IbcTracesResponse,
  IbcAckResponse,
  GrantsResponse,
  PoolInfo,
} from "../../common/interfaces";

const stableDenom =
  "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F";
const stablePoolId = "481";

const osmoDenom = "uosmo";
const osmoPoolId = "0";

const req = new Request();

async function getPoolList() {
  let url = "https://api-osmosis.imperator.co/pools/v2/all?low_liquidity=false";

  // download pools info
  let poolDatabase: PoolDatabase = await req.get(url);

  // skip low liquidity pools
  let valid_pools: PoolInfo[] = [];
  Object.entries(poolDatabase).forEach(([key, [assetFirst, assetSecond]]) => {
    if (
      assetSecond.denom === "uosmo" &&
      assetSecond.liquidity > 100_000 &&
      key !== "678"
    ) {
      valid_pools.push({
        id: +key,
        denom: assetFirst.denom,
        price: new Decimal(assetFirst.price),
      } as PoolInfo);
    }
  });

  return valid_pools;
}

function _setPagination(offset: number, limit: number) {
  return {
    params: {
      "pagination.offset": offset,
      "pagination.limit": limit,
      "pagination.count_total": true,
    },
  };
}

async function getIbcChannelList(
  chainRegistryStorage: ChainRegistryStorage | undefined,
  chainType: "main" | "test"
) {
  if (!chainRegistryStorage) return;

  const chain = chainRegistryStorage.find(
    ({ denomNative }) => denomNative === "uosmo"
  );
  if (!chain) return;

  const re = /^transfer\/channel-[0-9]*$/;
  const urlTraces = "/ibc/apps/transfer/v1/denom_traces";
  let rest: string | undefined;

  if (chainType === "main" && chain.main) {
    rest = chain.main.apis.rest?.[0]?.address;
  }
  if (chainType === "test" && chain.test) {
    rest = chain.test.apis.rest?.[0]?.address;
  }
  if (!rest) return;

  let resTraces: IbcTracesResponse | undefined;

  try {
    // get ibc channels
    resTraces = await _specifyTimeout(
      req.get(rest + urlTraces, _setPagination(0, 10_000))
    );
  } catch (error) {}
  if (!resTraces) return;

  let denomList = chainRegistryStorage.map(({ denomNative }) => denomNative);
  let denomAndChannelIdList: [string, string | undefined][] = [];

  for (let denom of denomList) {
    // get direct routes
    const tracesByDenom = resTraces.denom_traces.filter(
      ({ base_denom, path }) => base_denom === denom && re.test(path)
    );

    let txAmountAndChannelId: [number, string | undefined] = [0, undefined];
    let promises: Promise<void>[] = [];

    // find working channel by amount of txs
    for (let item of tracesByDenom) {
      const [port, channel] = item.path.split("/");

      const fn = async () => {
        try {
          const resPackets: IbcAckResponse = await _specifyTimeout(
            req.get(
              rest +
                `/ibc/core/channel/v1/channels/${channel}/ports/${port}/packet_acknowledgements`
            )
          );

          const txAmount = resPackets.acknowledgements.length;

          if (txAmount > txAmountAndChannelId[0]) {
            txAmountAndChannelId = [txAmount, channel];
          }
        } catch (error) {}
      };

      promises.push(fn());
    }

    await Promise.all(promises);

    denomAndChannelIdList.push([denom, txAmountAndChannelId[1]]);
  }

  return denomAndChannelIdList.filter(([denom, channel]) => channel);
}

// allows to get 1 working rest from chain registry rest list for single network
async function _verifyRest(restList: string[]) {
  let urlList: string[] = [];

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

  let urlAndValidatorsList: [string, number][] = []; // url and validator set length
  let promiseList: Promise<void>[] = [];

  for (let urlItem of urlList) {
    // data provided by validators via REST API may differ
    // so we gonna use largest dataset
    const fn = async () => {
      const [a, b] = urlItem.split(":");
      // TODO: write validator set to storage
      const url = `${a}:${b}/cosmos/staking/v1beta1/validators?pagination.limit=200&status=BOND_STATUS_BONDED`;
      try {
        const res: ValidatorListResponse = await _specifyTimeout(req.get(url));
        urlAndValidatorsList.push([urlItem, res.validators.length]);
      } catch (error) {}
    };

    promiseList.push(fn());
  }

  await Promise.all(promiseList);
  const valSetList = urlAndValidatorsList.map(([a, b]) => b);
  const maxValSetLength = Math.max(...valSetList);
  const [targetUrl, targetValSet] = urlAndValidatorsList.find(
    ([a, b]) => b === maxValSetLength
  ) as [string, number];
  l({ targetUrl, targetValSet });

  return targetUrl;
}

// allows to get 1 working rest from chain registry rest list for all networks
async function _verifyRestList(
  prefixAndRestList: [string, string, string[]][]
) {
  let resultList: [string, string, string | undefined][] = [];

  // for some reasons Promise.all usage leads to data losses
  // so sequential requests must be used here
  for (let [prefix, chainType, restList] of prefixAndRestList) {
    try {
      const restChecked = await _specifyTimeout(_verifyRest(restList), 10_000);
      resultList.push([prefix, chainType, restChecked]);
    } catch (error) {}
  }

  return resultList;
}

// allows to get 1 working rpc from chain registry rpc list for single network
async function _verifyRpc(rpcList: string[], prefix: string) {
  const portList = ["443", "26657"];
  let urlList: string[] = [];

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

  let urlChecked: string | undefined;

  for (let url of urlList) {
    // query balances to check if url is fine
    try {
      const sgQueryHelpers = await getSgQueryHelpers(url);
      if (!sgQueryHelpers) return;

      const { getAllBalances } = sgQueryHelpers;
      await _specifyTimeout(
        getAllBalances(getAddrByPrefix(DAPP_ADDRESS, prefix))
      );
      urlChecked = url;
      break;
    } catch (error) {
      // l({ fn: "_verifyRpc", error });
    }
  }

  l({ urlChecked });
  return urlChecked;
}

// allows to get 1 working rpc from chain registry rpc list for all networks
async function _verifyRpcList(prefixAndRpcList: [string, string, string[]][]) {
  let resultList: [string, string, string | undefined][] = [];

  // for some reasons Promise.all returns array of undefined
  // so sequential requests must be used here
  for (let [prefix, chainType, rpcList] of prefixAndRpcList) {
    try {
      const rpcChecked = await _verifyRpc(rpcList, prefix);
      resultList.push([prefix, chainType, rpcChecked]);
    } catch (error) {
      // l({ fn: "_verifyRpcList", error });
    }
  }

  return resultList;
}

async function _queryMainnetNames() {
  try {
    const mainnetContentResponseList: NetworkContentResponse[] = await req.get(
      "https://api.github.com/repos/cosmos/chain-registry/contents"
    );

    let names: string[] = [];

    for (let { name: rawName } of mainnetContentResponseList) {
      const code = rawName.charCodeAt(0);

      if (
        !rawName.includes(".") &&
        rawName !== "testnets" &&
        code >= 97 &&
        code < 123
      ) {
        names.push(rawName);
      }
    }

    return names;
  } catch (error) {
    l(error);
    return [];
  }
}

async function _queryTestnetNames() {
  try {
    const testnetContentResponseList: NetworkContentResponse[] = await req.get(
      "https://api.github.com/repos/cosmos/chain-registry/contents/testnets"
    );

    return testnetContentResponseList.map(({ name }) => name);
  } catch (error) {
    l(error);
    return [];
  }
}

async function _queryNetworkNames() {
  const promises = [_queryMainnetNames(), _queryTestnetNames()];
  const [main, test] = await Promise.all(promises);
  return { main, test };
}

async function _mainnetQuerier(chainUrl: string, assetListUrl: string) {
  let data: NetworkData = {
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

  let promises: [Promise<ChainResponse>, Promise<AssetList>] = [
    req.get(chainUrl),
    req.get(assetListUrl),
  ];

  try {
    let [chainRes, assetListRes] = await Promise.all(promises);
    let { logo_URIs, symbol, denom_units, coingecko_id } =
      assetListRes.assets[0];
    let imgUrl = logo_URIs?.svg || logo_URIs.png;
    let { exponent } = getLast(denom_units);
    let { denom } = denom_units[0];

    data = {
      ...data,
      prefix: chainRes.bech32_prefix,
      main: chainRes,
      img: imgUrl,
      symbol,
      denomNative: denom,
      exponent,
      coinGeckoId: coingecko_id,
    };
  } catch (error) {}

  return data;
}

async function _testnetQuerier(chainUrl: string) {
  let data: NetworkData = {
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
    let chainRes: ChainResponse = await req.get(chainUrl);

    data = {
      ...data,
      prefix: chainRes.bech32_prefix,
      test: chainRes,
    };
  } catch (error) {}

  return data;
}

function _modifyRpcList(
  prefixAndRpcList: [string, string, string[]][],
  allowList: [string, string, string[]][],
  ignoreList: [string, string, string[]][]
): [string, string, string[]][] {
  if (!allowList.length && !ignoreList.length) return prefixAndRpcList;

  let temp: [string, string, string[]][] = [];

  for (let [prefix1, chainType1, rpcList1] of prefixAndRpcList) {
    const allowListItem = allowList.find(
      ([prefix2, chainType2, rpcList2]) =>
        prefix1 === prefix2 && chainType1 === chainType2
    );
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
    const ignoreListItem = ignoreList.find(
      ([prefix2, chainType2, rpcList2]) =>
        prefix1 === prefix2 && chainType1 === chainType2
    );
    if (!ignoreListItem) return [prefix1, chainType1, rpcList1];

    let res: string[] = [];

    for (let rpc of rpcList1) {
      if (!ignoreListItem[2].includes(rpc)) {
        res.push(rpc);
      }
    }

    return [prefix1, chainType1, res];
  });

  return temp;
}

async function _queryNetworksData(
  mainList: string[],
  testList: string[],
  allowList: [string, string, string[]][],
  ignoreList: [string, string, string[]][]
) {
  let promises: Promise<NetworkData>[] = [];

  for (let chainName of mainList) {
    let chainUrl = `https://raw.githubusercontent.com/cosmos/chain-registry/master/${chainName}/chain.json`;
    let assetListUrl = `https://raw.githubusercontent.com/cosmos/chain-registry/master/${chainName}/assetlist.json`;
    promises.push(_mainnetQuerier(chainUrl, assetListUrl));
  }

  for (let chainName of testList) {
    let chainUrl = `https://raw.githubusercontent.com/cosmos/chain-registry/master/testnets/${chainName}/chain.json`;
    promises.push(_testnetQuerier(chainUrl));
  }

  let rawNetworkData = await Promise.all(promises);
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
  let prefixAndRpcList: [string, string, string[]][] = [];
  let prefixAndRestList: [string, string, string[]][] = [];

  for (let { prefix, main, test } of networkData) {
    if (main) {
      const chainType = "main";
      const rpcList = (main?.apis?.rpc || []).map(({ address }) => address);
      const restList = (main?.apis?.rest || []).map(({ address }) => address);
      prefixAndRpcList.push([prefix, chainType, rpcList]);
      prefixAndRestList.push([prefix, chainType, restList]);
    }

    if (test) {
      const chainType = "test";
      const rpcList = (test?.apis?.rpc || []).map(({ address }) => address);
      const restList = (test?.apis?.rest || []).map(({ address }) => address);
      prefixAndRpcList.push([prefix, chainType, rpcList]);
      prefixAndRestList.push([prefix, chainType, restList]);
    }
  }

  const [prefixAndRpcChecked, prefixAndRestChecked] = await Promise.all([
    _verifyRpcList(_modifyRpcList(prefixAndRpcList, allowList, ignoreList)),
    _verifyRestList(prefixAndRestList),
  ]);

  let networkDataChecked: NetworkData[] = [];

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

      const rpcAddress = rpcMain?.[2];
      const rpcMainChecked = rpcAddress
        ? [{ address: rpcAddress, provider }]
        : [];

      const restAddress = restMain?.[2];
      const restMainChecked = restAddress
        ? [{ address: restAddress, provider }]
        : [];

      const { apis } = main;
      mainChecked = {
        ...main,
        apis: { ...apis, rpc: rpcMainChecked, rest: restMainChecked },
      };
    }

    if (test) {
      const chainType = "test";
      const rpcTest = rpcListChecked.find(([p, c]) => c === chainType);
      const restTest = restListChecked.find(([p, c]) => c === chainType);

      const rpcAddress = rpcTest?.[2];
      const rpcTestChecked = rpcAddress
        ? [{ address: rpcAddress, provider }]
        : [];

      const restAddress = restTest?.[2];
      const restTestChecked = restAddress
        ? [{ address: restAddress, provider }]
        : [];

      const { apis } = test;
      testChecked = {
        ...test,
        apis: { ...apis, rpc: rpcTestChecked, rest: restTestChecked },
      };
    }

    networkDataChecked.push({
      ...networkDataItem,
      main: mainChecked,
      test: testChecked,
    });
  }

  return networkDataChecked;
}

async function getChainRegistry(
  allowList: [string, string, string[]][],
  ignoreList: [string, string, string[]][]
) {
  const { main, test } = await _queryNetworkNames();
  return await _queryNetworksData(main, test, allowList, ignoreList);
}

function mergeChainRegistry(
  chainRegistryStorage: ChainRegistryStorage | undefined,
  chainRegistryResponse: NetworkData[]
) {
  if (!chainRegistryStorage) return chainRegistryResponse;

  let result: ChainRegistryStorage = [];

  // find intersection of old and new lists
  // and update rpc and rest if it's needed
  for (let resItem of chainRegistryResponse) {
    for (let storageItem of chainRegistryStorage) {
      if (resItem.prefix === storageItem.prefix) {
        const resMainRpc = resItem.main?.apis?.rpc || [];
        const resMainRest = resItem.main?.apis?.rest || [];
        const resMainRpcLen = resMainRpc.length;
        const resMainRestLen = resMainRest.length;

        const resTestRpc = resItem.test?.apis?.rpc || [];
        const resTestRest = resItem.test?.apis?.rest || [];
        const resTestRpcLen = resTestRpc.length;
        const resTestRestLen = resTestRest.length;

        let storMainRpc = storageItem.main?.apis?.rpc || [];
        let storMainRest = storageItem.main?.apis?.rest || [];
        const storMainRpcLen = storMainRpc.length;
        const storMainRestLen = storMainRest.length;

        let storTestRpc = storageItem.test?.apis?.rpc || [];
        let storTestRest = storageItem.test?.apis?.rest || [];
        const storTestRpcLen = storTestRpc.length;
        const storTestRestLen = storTestRest.length;

        // doesn't update if operating adresses are not received
        if (resMainRpcLen >= storMainRpcLen) storMainRpc = resMainRpc;
        if (resMainRestLen >= storMainRestLen) storMainRest = resMainRest;
        if (resTestRpcLen >= storTestRpcLen) storTestRpc = resTestRpc;
        if (resTestRestLen >= storTestRestLen) storTestRest = resTestRest;

        let temp: NetworkData = resItem;

        if (temp.main) {
          const { main } = temp;
          const { apis } = main;

          temp = {
            ...temp,
            main: {
              ...main,
              apis: { ...apis, rpc: storMainRpc, rest: storMainRest },
            },
          };
        }

        if (temp.test) {
          const { test } = temp;
          const { apis } = test;

          temp = {
            ...temp,
            test: {
              ...test,
              apis: { ...apis, rpc: storTestRpc, rest: storTestRest },
            },
          };
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

function mergeIbcChannels(
  ibcChannelsStorage: IbcChannelsStorage | undefined,
  ibcChannelsResponse: IbcResponse[] | undefined
) {
  if (!ibcChannelsStorage || !ibcChannelsResponse) return ibcChannelsResponse;

  for (let resItem of ibcChannelsResponse) {
    // replace item if it's found in storage or add a new
    ibcChannelsStorage = [
      ...ibcChannelsStorage.filter(
        ({ destination }) => destination !== resItem.destination
      ),
      resItem,
    ];
  }

  return ibcChannelsStorage;
}

function mergePools(
  poolsStorage: PoolsStorage | undefined,
  poolsResponse: [string, AssetDescription[]][]
) {
  if (!poolsStorage) return poolsResponse;

  for (let resItem of poolsResponse) {
    // replace item if it's found in storage or add a new
    poolsStorage = [
      ...poolsStorage.filter(([k, v]) => k !== resItem[0]),
      resItem,
    ];
  }

  return poolsStorage;
}

async function getIbcChannnels(
  chainRegistryStorage: ChainRegistryStorage | undefined,
  chainType: "main" | "test"
): Promise<IbcResponse[] | undefined> {
  if (!chainRegistryStorage) return;

  const pools = await getPools();

  let IbcResponseList: IbcResponse[] = [];

  for (const [key, [v0, v1]] of pools) {
    if (v1.denom !== "uosmo") continue;

    const chain = chainRegistryStorage.find(
      ({ symbol }) => symbol === v0.symbol
    );
    if (!chain) continue;

    // if testnet skip unused chains
    let a_channel_id = "";
    let a_port_id = "";
    if (chainType === "test") {
      if (
        chain.test?.chain_id !== ibcConfigAb.b_chain_id &&
        chain.test?.chain_id !== ibcConfigAc.b_chain_id
      ) {
        continue;
      }

      ({ a_channel_id, a_port_id } =
        chain.test.chain_id === ibcConfigAb.b_chain_id
          ? ibcConfigAb
          : ibcConfigAc);
    }

    const { denomNative } = chain;
    const port_id = chainType === "main" ? "transfer" : a_port_id;
    const denomIbc =
      chainType === "main"
        ? v0.denom
        : _getIbcDenom(
            a_channel_id,
            `${port_id}/${_getChannelId(
              denomNative,
              v0.denom,
              port_id
            )}/${denomNative}`,
            port_id
          );
    const channel_id =
      chainType === "main"
        ? _getChannelId(denomNative, denomIbc)
        : a_channel_id;
    if (!channel_id) continue;

    const destination =
      chainType === "main" ? chain.main?.chain_id : chain.test?.chain_id;
    if (!destination) continue;

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
}

async function requestRelayers(
  chainRegistryStorage: ChainRegistryStorage | undefined,
  chainType: "main" | "test"
): Promise<RelayerStruct[] | undefined> {
  let relayerStructList: RelayerStruct[] = [];
  let ibcResponseList: IbcResponse[] | undefined; // from osmo channels only
  let poolList: [string, AssetDescription[]][] = [];

  await Promise.all([
    (async () => {
      try {
        ibcResponseList = await getIbcChannnels(
          chainRegistryStorage,
          chainType
        );
      } catch (error) {}
    })(),
    (async () => {
      try {
        poolList = await getPools();
      } catch (error) {}
    })(),
  ]);
  if (!ibcResponseList) return;

  for (const { destination: chain_id, channel_id } of ibcResponseList) {
    let chain: NetworkData | undefined;

    if (chainType === "main") {
      chain = chainRegistryStorage?.find(
        (item) => item.main?.chain_id === chain_id
      );
    }
    if (chainType === "test") {
      chain = chainRegistryStorage?.find(
        (item) => item.test?.chain_id === chain_id
      );
    }
    if (!chain) continue;

    const pool = poolList.find(
      ([k, [{ symbol, denom }, v1]]) => symbol === chain?.symbol
    );
    if (!pool) continue;

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
}

async function getPools() {
  const url =
    "https://api-osmosis.imperator.co/pools/v2/all?low_liquidity=false";

  // download pools info
  let poolDatabase: PoolDatabase = await req.get(url);

  // skip low liquidity pools
  let valid_pools = Object.entries(poolDatabase).filter(
    ([_, [v0]]) => v0.liquidity > 1_000
  );

  return valid_pools;
}

function filterChainRegistry(
  chainRegistry: NetworkData[] | undefined,
  ibcChannels: IbcResponse[] | undefined,
  pools: [string, AssetDescription[]][] | undefined,
  validators: [string, ValidatorResponseReduced[]][] | undefined,
  chainType: "main" | "test"
): {
  chainRegistry: NetworkData[];
  ibcChannels: IbcResponse[];
  pools: [string, AssetDescription[]][];
  activeNetworks: PoolExtracted[];
} {
  if (!chainRegistry || !ibcChannels || !pools || !validators) {
    return {
      chainRegistry: chainRegistry || [],
      ibcChannels: ibcChannels || [],
      pools: pools || [],
      activeNetworks: [],
    };
  }

  const ibcChannelDestinations = ibcChannels.map(
    ({ destination }) => destination
  );
  const osmoPools = pools.filter(([k, [v1, v2]]) => v2.symbol === "OSMO");

  const poolSymbols = osmoPools.map(([k, [v1, v2]]) => v1.symbol);

  const validatorsChains = validators.map((item) => item[0]);

  let chainRegistryFiltered: NetworkData[] = [];

  if (chainType === "main") {
    chainRegistryFiltered = chainRegistry.filter(({ symbol, main }) => {
      if (!main) return false;

      return (
        ibcChannelDestinations.includes(main.chain_id) &&
        poolSymbols.includes(symbol) &&
        validatorsChains.includes(main.chain_name)
      );
    });
  } else {
    chainRegistryFiltered = chainRegistry.filter(({ symbol, test }) => {
      if (!test) return false;

      return (
        ibcChannelDestinations.includes(test.chain_id) &&
        poolSymbols.includes(symbol) &&
        validatorsChains.includes(test.chain_name)
      );
    });
  }

  const osmoChainRegistry = chainRegistry.find(
    ({ symbol }) => symbol === "OSMO"
  );
  if (typeof osmoChainRegistry !== "undefined") {
    chainRegistryFiltered.push(osmoChainRegistry);
  }

  chainRegistryFiltered = chainRegistryFiltered.sort((a, b) =>
    a.symbol > b.symbol ? 1 : -1
  );

  const chainRegistryFilteredSymbols = chainRegistryFiltered.map(
    ({ symbol }) => symbol
  );

  let chainRegistryFilteredDestinations: string[] = [];

  if (chainType === "main") {
    chainRegistryFilteredDestinations = chainRegistryFiltered.map(
      ({ main }) => {
        if (!main) return "";
        return main.chain_id;
      }
    );
  } else {
    chainRegistryFilteredDestinations = chainRegistryFiltered.map(
      ({ test }) => {
        if (!test) return "";
        return test.chain_id;
      }
    );
  }

  const ibcChannelsFiltered = ibcChannels.filter(({ destination }) =>
    chainRegistryFilteredDestinations.includes(destination)
  );

  const poolsFiltered = osmoPools.filter(([k, [v1, v2]]) =>
    chainRegistryFilteredSymbols.includes(v1.symbol)
  );

  let activeNetworks: PoolExtracted[] = [];

  for (let chainRegistry of chainRegistryFiltered) {
    let ibcChannel: IbcResponse | undefined;
    let denom: string;
    let id: string;
    let price: number;

    if (chainType === "main") {
      const { main } = chainRegistry;
      if (!main) continue;

      const pool = poolsFiltered.find(
        ([k, [v1, v2]]) => v1.symbol === chainRegistry.symbol
      );
      if (!pool) continue;
      [id, [{ denom, price }]] = pool;

      ibcChannel = ibcChannelsFiltered.find(
        ({ destination }) => destination === main.chain_id
      );
    } else {
      const { test } = chainRegistry;
      if (!test) continue;

      const pool = poolsFiltered.find(
        ([k, [v1, v2]]) => v1.symbol === chainRegistry.symbol
      );
      if (!pool) continue;
      [id, [{ denom, price }]] = pool;

      ibcChannel = ibcChannelsFiltered.find(
        ({ destination }) => destination === test.chain_id
      );
    }

    if (!ibcChannel) continue;

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
  const priceList = osmoPools.map(
    ([id, [assetFirst, assetOsmo]]) => assetOsmo.price
  );
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
    const pool = poolsFiltered.find(
      ([k, [v0, v1]]) => v0.symbol === item.symbol
    );
    if (!pool) return item;

    const [k, [v0, v1]] = pool;

    return { ...item, denomIbc: v0.denom };
  });

  return {
    chainRegistry: chainRegistryFiltered,
    ibcChannels: ibcChannelsFiltered,
    pools: poolsFiltered,
    activeNetworks,
  };
}

function _getChainByChainId(
  chainRegistryStorage: ChainRegistryStorage | undefined,
  chainId: string
): NetworkData | undefined {
  if (!chainRegistryStorage) return;

  const mainnet = chainRegistryStorage.find(
    (item) => item.main?.chain_id === chainId
  );
  const testnet = chainRegistryStorage.find(
    (item) => item.test?.chain_id === chainId
  );

  return testnet || mainnet;
}

// TODO: remove requestRelayers -> getIbcChannnels -> getIbcChannelList
// merge requestRelayers with requestPools to validate asset symbols
// and filter IBC active networks
async function getActiveNetworksInfo(
  chainRegistryStorage: ChainRegistryStorage | undefined,
  chainType: "main" | "test"
): Promise<PoolExtracted[] | undefined> {
  if (!chainRegistryStorage) return;

  const pools = await getPools();

  let temp: PoolExtracted[] = [];

  for (const [key, [v0, v1]] of pools) {
    if (v1.denom !== "uosmo") continue;

    const chain = chainRegistryStorage.find(
      ({ symbol }) => symbol === v0.symbol
    );
    if (!chain) continue;

    // if testnet skip unused chains
    let a_channel_id = "";
    let a_port_id = "";
    if (chainType === "test") {
      if (
        chain.test?.chain_id !== ibcConfigAb.b_chain_id &&
        chain.test?.chain_id !== ibcConfigAc.b_chain_id
      ) {
        continue;
      }

      ({ a_channel_id, a_port_id } =
        chain.test.chain_id === ibcConfigAb.b_chain_id
          ? ibcConfigAb
          : ibcConfigAc);
    }

    const { denomNative, symbol } = chain;
    const port_id = chainType === "main" ? "transfer" : a_port_id;
    // provided only to get channel_id
    const denomIbc =
      chainType === "main"
        ? v0.denom
        : _getIbcDenom(
            a_channel_id,
            `${port_id}/${_getChannelId(
              denomNative,
              v0.denom,
              port_id
            )}/${denomNative}`,
            port_id
          );
    const channel_id =
      chainType === "main"
        ? _getChannelId(denomNative, denomIbc)
        : a_channel_id;
    if (!channel_id) continue;

    temp.push({
      channel_id,
      denom: v0.denom, // ibc denom from pool is required
      id: key,
      port_id,
      price: v0.price.toString(),
      symbol,
    });
  }

  return temp;
}

async function updatePoolsAndUsers(
  chainRegistryResponse: ChainRegistryStorage | undefined,
  queryPoolsAndUsersResponse: QueryPoolsAndUsersResponse | undefined,
  poolsStorage: PoolsStorage | undefined,
  chainType: "main" | "test"
) {
  if (!queryPoolsAndUsersResponse || !chainRegistryResponse)
    return queryPoolsAndUsersResponse;
  let { pools, users } = queryPoolsAndUsersResponse;

  let poolsData = await getActiveNetworksInfo(chainRegistryResponse, chainType);
  if (!poolsData) return;

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
    ...pools.filter(
      ({ denom }) => denom !== stablePool.denom && denom !== osmoPool.denom
    ),
    stablePool,
    osmoPool,
  ];

  let usersFundsList = await getUserFunds(
    chainRegistryResponse,
    queryPoolsAndUsersResponse,
    poolsStorage,
    chainType
  );

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

  l({ fn: "updatePoolsAndUsers", pools, assetList: users?.[0]?.asset_list });
  return { pools, users };
}

async function _getValidators(rest: string) {
  const [a, b] = rest.split(":");
  const url = `${a}:${b}/cosmos/staking/v1beta1/validators?pagination.limit=200&status=BOND_STATUS_BONDED`;

  try {
    const res: ValidatorListResponse = await req.get(url);

    return res.validators
      .filter(({ jailed }) => !jailed)
      .map(({ operator_address, description: { moniker } }) => ({
        operator_address,
        moniker: moniker.trim(),
      }));
  } catch (error) {
    return [];
  }
}

async function getValidators(
  cnainNameAndRestList: [string, string][]
): Promise<[string, ValidatorResponseReduced[]][]> {
  let validatorList: [string, ValidatorResponseReduced[]][] = [];
  let promiseList: Promise<void>[] = [];

  for (let [cnainName, rest] of cnainNameAndRestList) {
    const fn = async () => {
      validatorList.push([cnainName, await _getValidators(rest)]);
    };

    promiseList.push(fn());
  }

  await Promise.all(promiseList);

  return validatorList;
}

function getChainNameAndRestList(
  chainRegistryStorage: ChainRegistryStorage | undefined,
  chainType: "main" | "test"
): [string, string][] {
  if (!chainRegistryStorage) return [];

  let chainNameAndRestList: [string, string][] = [];

  for (let { main, test } of chainRegistryStorage) {
    if (chainType === "main" && main) {
      const rest = main?.apis?.rest || [];
      if (!rest.length) {
        continue;
      }
      chainNameAndRestList.push([main.chain_name, rest[0].address]);
    }

    if (chainType === "test" && test) {
      const rest = test?.apis?.rest || [];
      if (!rest.length) {
        continue;
      }
      chainNameAndRestList.push([test.chain_name, rest[0].address]);
    }
  }

  return chainNameAndRestList;
}

async function getUserFunds(
  chainRegistryResponse: ChainRegistryStorage | undefined,
  queryPoolsAndUsersResponse: QueryPoolsAndUsersResponse | undefined,
  poolsStorage: PoolsStorage | undefined,
  chainType: "main" | "test"
): Promise<
  {
    chain: string;
    osmoAddr: string;
    address: string;
    holded: Coin;
    staked: Coin;
  }[]
> {
  if (!chainRegistryResponse || !queryPoolsAndUsersResponse || !poolsStorage) {
    return [];
  }

  // assign ibc denoms
  chainRegistryResponse = chainRegistryResponse.map((item) => {
    const { symbol } = item;
    const pool = poolsStorage.find(([key, [v0, v1]]) => v0.symbol === symbol);
    if (!pool) return item;

    const [key, [v0, v1]] = pool;
    return { ...item, denomIbc: v0.denom };
  });

  let resList: {
    chain: string;
    osmoAddr: string;
    address: string;
    holded: Coin;
    staked: Coin;
  }[] = [];

  let promiseList: Promise<void>[] = [];

  for (let user of queryPoolsAndUsersResponse.users) {
    for (let asset of user.asset_list) {
      const chain = chainRegistryResponse.find(
        ({ prefix }) => prefix === asset.wallet_address.split("1")[0]
      );
      if (!chain) continue;

      const { denomNative } = chain;
      if (chainType === "main" && chain.main) {
        const rest = chain.main?.apis?.rest?.[0]?.address;

        if (rest) {
          const urlHolded = `${rest}/cosmos/bank/v1beta1/balances/${asset.wallet_address}`;
          const urlStaked = `${rest}/cosmos/staking/v1beta1/delegations/${asset.wallet_address}`;

          const fn = async () => {
            try {
              const balHolded: BalancesResponse = await req.get(urlHolded);
              const balStaked: DelegationsResponse = await req.get(urlStaked);

              const amountHolded =
                balHolded.balances.find(({ denom }) => denom === denomNative)
                  ?.amount || "0";
              const amountStaked =
                balStaked.delegation_responses.find(
                  ({ balance: { denom } }) => denom === denomNative
                )?.balance.amount || "0";

              resList.push({
                address: asset.wallet_address,
                osmoAddr: user.osmo_address,
                chain: chain.main?.chain_name as string,
                holded: coin(amountHolded, denomNative),
                staked: coin(amountStaked, denomNative),
              });
            } catch (error) {}
          };

          promiseList.push(fn());
        }
      }

      if (chainType === "test" && chain.test) {
        const rest = chain.test?.apis?.rest?.[0]?.address;

        if (rest) {
          const urlHolded = `${rest}/cosmos/bank/v1beta1/balances/${asset.wallet_address}`;
          const urlStaked = `${rest}/cosmos/staking/v1beta1/delegations/${asset.wallet_address}`;

          const ibcDenomAb =
            denomNative !== "uosmo"
              ? _getIbcDenom(
                  ibcConfigAb.b_channel_id,
                  `${ibcConfigAb.a_port_id}/${_getChannelId(
                    denomNative,
                    chain.denomIbc,
                    ibcConfigAb.a_port_id
                  )}/${denomNative}`,
                  ibcConfigAb.a_port_id
                )
              : "uosmo";

          const ibcDenomAc =
            denomNative !== "uosmo"
              ? _getIbcDenom(
                  ibcConfigAc.b_channel_id,
                  `${ibcConfigAc.a_port_id}/${_getChannelId(
                    denomNative,
                    chain.denomIbc,
                    ibcConfigAc.a_port_id
                  )}/${denomNative}`,
                  ibcConfigAc.a_port_id
                )
              : "uosmo";

          const ibcConfigList: string[] = [ibcDenomAb, ibcDenomAc];

          const fn = async () => {
            try {
              const balHolded: BalancesResponse = await req.get(urlHolded);
              const balStaked: DelegationsResponse = await req.get(urlStaked);

              const amountHolded =
                balHolded.balances.find(({ denom }) => {
                  if (denom === "ujunox") {
                    return (
                      chain.denomNative ===
                        _getIbcDenom(
                          ibcConfigAb.a_channel_id,
                          "transfer/channel-42/ujuno",
                          ibcConfigAb.a_port_id
                        ) ||
                      chain.denomNative ===
                        _getIbcDenom(
                          ibcConfigAc.a_channel_id,
                          "transfer/channel-42/ujuno",
                          ibcConfigAc.a_port_id
                        )
                    );
                  } else {
                    return ibcConfigList.includes(denom);
                  }
                })?.amount || "0";
              const amountStaked =
                balStaked.delegation_responses.find(
                  ({ balance: { denom } }) => {
                    if (denom === "ujunox") {
                      return denomNative === "ujuno";
                    } else {
                      return denom === denomNative;
                    }
                  }
                )?.balance.amount || "0";

              resList.push({
                address: asset.wallet_address,
                osmoAddr: user.osmo_address,
                chain: chain.test?.chain_name as string,
                holded: coin(amountHolded, denomNative),
                staked: coin(amountStaked, denomNative),
              });
            } catch (error) {}
          };

          promiseList.push(fn());
        }
      }
    }
  }

  await Promise.all(promiseList);

  return resList;
}

// returns [denom, [granter, valoper][]][] for specified grantee on all chains
async function _getAllGrants(
  grantee: string,
  chainRegistryResponse: ChainRegistryStorage | undefined,
  chainType: "main" | "test"
) {
  if (!chainRegistryResponse) return;

  let denomGranterValoperList: [string, [string, string][]][] = [];
  let promiseList: Promise<void>[] = [];

  for (let chain of chainRegistryResponse) {
    let rest: string | undefined;

    if (chainType === "main" && chain.main) {
      rest = chain.main?.apis?.rest?.[0]?.address;
    }
    if (chainType === "test" && chain.test) {
      rest = chain.test?.apis?.rest?.[0]?.address;
    }
    if (!rest) continue;

    const urlGrants = `${rest}/cosmos/authz/v1beta1/grants/grantee/${getAddrByPrefix(
      grantee,
      chain.prefix
    )}`;

    const fn = async () => {
      try {
        const res: GrantsResponse = await req.get(urlGrants);

        const granterAndValoperList: [string, string][] = res.grants.map(
          ({ granter, authorization: { allow_list } }) => [
            granter,
            allow_list.address[0],
          ]
        );

        denomGranterValoperList.push([
          chain.denomNative,
          granterAndValoperList,
        ]);
      } catch (error) {}
    };

    promiseList.push(fn());
  }

  await Promise.all(promiseList);

  return denomGranterValoperList.filter(([chain, list]) => list.length);
}

// transforms [denom, [granter, valoper][]][] -> [[denom, granter, valoper][]][]
// to provide async signing txs on different chains
function _transformGrantList(
  denomGranterValoperList: [string, [string, string][]][]
) {
  let res: [string, string, string][][] = [];

  for (const [denom, granterValoperList] of denomGranterValoperList) {
    for (let i in granterValoperList) {
      const [granter, valoper] = granterValoperList[i];

      res[i] = [...(res[i] || []), [denom, granter, valoper]];
    }
  }

  return res;
}

async function queryPools(chainRegistry: ChainRegistryStorage | undefined) {
  if (!chainRegistry) return;

  const chain = chainRegistry.find((item) => item.prefix === "osmo");
  if (!chain) return;

  const rest = chain.test?.apis.rest[0].address;
  if (!rest) return;

  const url = `${rest}/osmosis/gamm/v1beta1/pools`;
  const res = await req.get(url, _setPagination(10, 100));

  return res;
}

function getDappAddressAndDenomList(
  osmoAddress: string,
  chainRegistry: ChainRegistryStorage | undefined
) {
  if (!chainRegistry) return;

  let dappAddressAndDenomList: [string, string][] = [];

  for (let { denomIbc, prefix } of chainRegistry) {
    if (prefix === "osmo") denomIbc = "uosmo";

    dappAddressAndDenomList.push([
      getAddrByPrefix(osmoAddress, prefix),
      denomIbc,
    ]);
  }

  return dappAddressAndDenomList;
}

export {
  updatePoolsAndUsers,
  getChainRegistry,
  getIbcChannnels,
  getPools,
  getValidators,
  getUserFunds,
  filterChainRegistry,
  mergeChainRegistry,
  mergeIbcChannels,
  mergePools,
  _verifyRpc,
  _verifyRpcList,
  _verifyRest,
  _verifyRestList,
  getChainNameAndRestList,
  getIbcChannelList,
  _modifyRpcList,
  _getAllGrants,
  _transformGrantList,
  requestRelayers,
  getActiveNetworksInfo,
  queryPools,
  getDappAddressAndDenomList,
  _getChainByChainId,
  getPoolList,
};
