import { l, createRequest, getLast } from "../utils";
import {
  RelayerList,
  RelayerStruct,
  PoolDatabase,
  PoolExtracted,
  QueryPoolsAndUsersResponse,
  ChainsResponse,
  ChainResponse,
  BalancesResponse,
  DelegationsResponse,
  ValidatorListResponse,
  ValidatorResponse,
  NetworkData,
  AssetList,
} from "./interfaces";
import { getAddrByPrefix } from "../signers";
import { Coin } from "@cosmjs/stargate";
import { DENOMS } from "../helpers/assets";
import { parse } from "node-html-parser";

const req = createRequest({});

async function queryNetworkFactory(url: string, route: string) {
  try {
    let res = await req.get(url);
    let attrs = parse(res).querySelectorAll("a.js-navigation-open");
    let names: string[] = [];

    for (let attr of attrs) {
      let rawAttr = getLast(attr.rawAttrs.split(" "));
      if (!rawAttr.includes("tree")) continue;
      let rawName = getLast(rawAttr.split(route)).slice(0, -1);

      let code = rawName.charCodeAt(0);
      if (rawName !== "testnets" && code >= 97 && code < 123)
        names.push(rawName);
    }

    return names;
  } catch (error) {
    l(error);
    return [];
  }
}

async function queryMainnetNames() {
  return await queryNetworkFactory(
    "https://github.com/cosmos/chain-registry",
    "master/"
  );
}

async function queryTestnetNames() {
  return await queryNetworkFactory(
    "https://github.com/cosmos/chain-registry/tree/master/testnets",
    "testnets/"
  );
}

async function queryNetworkNames() {
  let promises = [queryMainnetNames(), queryTestnetNames()];
  let [main, test] = await Promise.all(promises);
  return { main, test };
}

async function mainnetQuerier(chainUrl: string, assetListUrl: string) {
  let data: NetworkData = {
    prefix: "",
    main: "",
    test: "",
    img: "",
    symbol: "",
    denom: "",
    exponent: 0,
  };

  let promises: [Promise<ChainResponse>, Promise<AssetList>] = [
    req.get(chainUrl),
    req.get(assetListUrl),
  ];

  try {
    let [chainRes, assetListRes] = await Promise.all(promises);
    let { logo_URIs, symbol, denom_units } = assetListRes.assets[0];
    let imgUrl = logo_URIs?.svg || logo_URIs.png;
    let { denom, exponent } = getLast(denom_units);

    data = {
      ...data,
      prefix: chainRes.bech32_prefix,
      main: chainRes,
      img: imgUrl,
      symbol,
      denom,
      exponent,
    };
  } catch (error) {}

  return data;
}

async function testnetQuerier(chainUrl: string) {
  let data: NetworkData = {
    prefix: "",
    main: "",
    test: "",
    img: "",
    symbol: "",
    denom: "",
    exponent: 0,
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

async function queryNetworksData(mainList: string[], testList: string[]) {
  let promises: Promise<NetworkData>[] = [];

  for (let chainName of mainList) {
    let chainUrl = `https://raw.githubusercontent.com/cosmos/chain-registry/master/${chainName}/chain.json`;
    let assetListUrl = `https://raw.githubusercontent.com/cosmos/chain-registry/master/${chainName}/assetlist.json`;
    promises.push(mainnetQuerier(chainUrl, assetListUrl));
  }

  for (let chainName of testList) {
    let chainUrl = `https://raw.githubusercontent.com/cosmos/chain-registry/master/testnets/${chainName}/chain.json`;
    promises.push(testnetQuerier(chainUrl));
  }

  let rawNetworkData = await Promise.all(promises);

  let networkData = rawNetworkData.filter((item) => item.main !== "");
  let testnetData = rawNetworkData.filter((item) => item.test !== "");

  for (let networkDataItem of networkData) {
    for (let testnetDataItem of testnetData) {
      if (networkDataItem.prefix === testnetDataItem.prefix) {
        networkDataItem.test = testnetDataItem.test;
      }
    }
  }

  return networkData;
}

async function getChainRegistry() {
  let { main, test } = await queryNetworkNames();
  return await queryNetworksData(main, test);
}

async function requestRelayers() {
  const url = "https://api.mintscan.io/v1/relayer/osmosis-1/paths";

  let data = (await req.get(url)) as RelayerList;

  let temp: RelayerStruct[] = [];

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
      let targetPath = item.stats.past.vol.receive?.find((item) => {
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

  temp = temp.filter(
    ({ channel_id, denom }) =>
      channel_id !== "" && denom !== undefined && denom.slice(0, 3) === "ibc"
  );

  return temp;
}

async function requestPools() {
  const url =
    "https://api-osmosis.imperator.co/pools/v2/all?low_liquidity=false";

  // download pools info
  let poolDatabase: PoolDatabase = await req.get(url);

  // skip low liquidity pools
  let valid_pools = Object.entries(poolDatabase).filter(
    ([_, [v0]]) => v0.liquidity > 100_000
  );

  return valid_pools;
}

// merge requestRelayers with requestPools to validate asset symbols
async function merge(): Promise<PoolExtracted[]> {
  let relayers = await requestRelayers();
  let pools = await requestPools();

  let temp: PoolExtracted[] = [];

  for (let i in pools) {
    const [key, [v0, v1]] = pools[i];

    if (v1.denom !== "uosmo") continue;

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
}

async function _updatePoolsAndUsers(response: QueryPoolsAndUsersResponse) {
  let { pools, users } = response;

  let poolsData = await merge();

  for (let pool of pools) {
    for (let poolsDataItem of poolsData) {
      if (pool.denom === poolsDataItem.denom) {
        pool.price = poolsDataItem.price;
      }
    }
  }

  let osmoAddressList = users.map((user) => user.osmo_address);
  let usersFundsList = await requestUserFunds(osmoAddressList);

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

  l({ pools, users: users[0].asset_list });
  return { pools, users };
}

async function _mockUpdatePoolsAndUsers(): Promise<QueryPoolsAndUsersResponse> {
  let data = {
    pools: [
      {
        id: "1",
        denom:
          "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2",
        price: "11.5",
        symbol: "uatom",
        channel_id: "channel-0",
        port_id: "transfer",
      },
      {
        id: "497",
        denom:
          "ibc/46B44899322F3CD854D2D46DEEF881958467CDD4B3B10086DA49296BBED94BED",
        price: "3.5",
        symbol: "ujuno",
        channel_id: "channel-1110",
        port_id: "transfer",
      },
      {
        id: "481",
        denom:
          "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F",
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
            asset_denom: DENOMS.ATOM,
            wallet_address: "cosmos1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyklkm75",
            wallet_balance: "100",
          },

          {
            asset_denom: DENOMS.JUNO,
            wallet_address: "juno1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyqd4qeg",
            wallet_balance: "200",
          },
        ],
      },
    ],
  };

  return new Promise((res) => res(data));
}

function getDelegationsUrl(chain: string, address: string) {
  let url = `https://api-${chain}-ia.cosmosia.notional.ventures/cosmos/staking/v1beta1/delegations/${address}`;
  return url;
}

function getBalanceUrl(chain: string, address: string) {
  let url = `https://api-${chain}-ia.cosmosia.notional.ventures/cosmos/bank/v1beta1/balances/${address}`;
  return url;
}

async function requestUserFunds(addresses: string[]) {
  // request chain list
  let baseUrl = "https://cosmos-chain.directory/chains/";
  let { chains }: ChainsResponse = await req.get(baseUrl);
  chains = chains.filter((chain) => chain !== "testnets");

  // iterate over chain list
  let chainPromises: Promise<[string, string]>[] = [];

  async function requestChain(chain: string): Promise<[string, string]> {
    try {
      let res: ChainResponse = await req.get(baseUrl + chain);
      return [chain, res.bech32_prefix];
    } catch (error) {
      return ["", ""];
    }
  }

  for (let chain of chains) {
    chainPromises.push(requestChain(chain));
  }

  let prefixes: [string, string][] = await Promise.all(chainPromises);
  prefixes = prefixes
    .filter(([a, b]) => a !== "" || b !== "")
    .map(([a, b]) => {
      if (a === "likecoin") return [a, "like"]; // fix likecoin bech32prefix
      return [a, b];
    });

  // create chain and address list
  let chainAndAddressList: [string, string][] = [];

  for (let address of addresses) {
    for (let prefix of prefixes) {
      chainAndAddressList.push([
        prefix[0],
        getAddrByPrefix(address, prefix[1]),
      ]);
    }
  }

  // create address and coin list
  let balancePromises: Promise<[string, Coin]>[] = [];

  async function requestBalances(
    chain: string,
    address: string
  ): Promise<[string, Coin]> {
    try {
      let balance: BalancesResponse = await (
        await req.get(getBalanceUrl(chain, address))
      ).json();
      let delegation: DelegationsResponse = await (
        await req.get(getDelegationsUrl(chain, address))
      ).json();

      let { denom } = delegation.delegation_responses[0].balance;
      let balanceHolded = +(
        balance.balances.find((coin) => coin.denom === denom)?.amount || "0"
      );
      let balanceStaked = +delegation.delegation_responses[0].balance.amount;
      let coin: Coin = {
        amount: (balanceHolded + balanceStaked).toString(),
        denom,
      };
      return [address, coin];
    } catch (error) {
      let coin: Coin = { amount: "0", denom: "" };
      return [address, coin];
    }
  }

  for (let [chain, address] of chainAndAddressList) {
    balancePromises.push(requestBalances(chain, address));
  }

  let balanceList: [string, Coin][] = await Promise.all(balancePromises);
  balanceList = balanceList.filter(([_, { amount }]) => amount !== "0");

  return balanceList;
}

function getValidatorListUrl(chain: string) {
  let url = `https://api-${chain}-ia.cosmosia.notional.ventures/cosmos/staking/v1beta1/validators?pagination.limit=200&status=BOND_STATUS_BONDED`;
  return url;
}

async function _requestValidators() {
  // request chain list
  let baseUrl = "https://cosmos-chain.directory/chains/";
  let { chains }: ChainsResponse = await req.get(baseUrl);
  chains = chains.filter((chain) => chain !== "testnets");

  let validatorListPromises: Promise<[string, string[]]>[] = [];

  async function requestValidatorList(
    chain: string
  ): Promise<[string, string[]]> {
    let url = getValidatorListUrl(chain);
    try {
      let res: ValidatorListResponse = await req.get(url);
      // return [chain, res.validators.length.toString()];
      return [chain, res.validators.map((item) => item.description.moniker)];
    } catch (error) {
      return [chain, [""]];
    }
  }

  for (let chain of chains) {
    validatorListPromises.push(requestValidatorList(chain));
  }

  let validatorList: [string, string[]][] = await Promise.all(
    validatorListPromises
  );

  validatorList = validatorList.filter(([_, b]) => b[0] !== "");

  return validatorList;
}

export {
  _updatePoolsAndUsers,
  _mockUpdatePoolsAndUsers,
  _requestValidators,
  getChainRegistry,
};
