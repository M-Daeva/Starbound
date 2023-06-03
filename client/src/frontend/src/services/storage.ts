import { get, readable, writable } from "svelte/store";
import type { Writable } from "svelte/store";
import { Request, l } from "../../../common/utils";
import { baseURL } from "../config";
import { init } from "../account/wallet";
import { enc } from "crypto-js";
import { getValidatorListBySymbol, sortAssets } from "./helpers";
import { getAddrByPrefix } from "../../../common/account/clients";
import type {
  PoolExtracted,
  User,
} from "../../../common/codegen/StarboundOsmosis.types";
import type {
  NetworkData,
  IbcResponse,
  AssetDescription,
  ValidatorResponseReduced,
  AssetListItem,
  AuthzHandler,
  UserBalance,
  TimeInHoursAndMins,
} from "../../../common/interfaces";
import { ChainInfo } from "@keplr-wallet/types";

// global constants
const STABLECOIN_SYMBOL = "EEUR";
const STABLECOIN_EXPONENT = 6; // axelar USDC/ e-money EEUR

const LOCAL_STORAGE_KEY = "starbound-osmo-address";

const START_TIME_CONTRACT: TimeInHoursAndMins = { hours: 18, minutes: 0 };
const PERIOD_CONTRACT: TimeInHoursAndMins = { hours: 0, minutes: 30 };

const DAPP_ADDR = "osmo18tnvnwkklyv4dyuj8x357n7vray4v4zupj6xjt";
// TODO: change on mainnet
const CHAIN_TYPE: "main" | "test" = "test";

// TODO: replace some writable storages with readable

// api storages
let chainRegistryStorage: Writable<NetworkData[] | []> = writable([]);
let ibcChannellsStorage: Writable<IbcResponse[]> = writable([]);
let poolsStorage: Writable<[string, AssetDescription[]][]> = writable([]);
let validatorsStorage: Writable<[string, ValidatorResponseReduced[]][]> =
  writable([]);
let userFundsStorage: Writable<[string, UserBalance][]> = writable([]);

// contract storages
let userContractStorage: Writable<User> = writable();

// frontend storages
// assets from asset page
let assetListStorage: Writable<AssetListItem[]> = writable([]);
// multichain grant and revoke handlers
let authzHandlerListStorage: Writable<AuthzHandler[]> = writable([]);
// osmosis address
let addressStorage: Writable<string> = writable();
// assets sorting config
let sortingConfigStorage: Writable<{
  key: keyof AssetListItem;
  order: "asc" | "desc";
}> = writable({ key: "address", order: "asc" });
// controls tx hash modal
let isModalActiveStorage: Writable<boolean> = writable(false);
// keeps last tx hash
let txResStorage: Writable<["Success" | "Error", string]> = writable([
  "Success",
  "",
]);

let currenChain: Writable<ChainInfo> = writable();
class Localstorage {
  get(): string | undefined {
    const value = `${localStorage.getItem(LOCAL_STORAGE_KEY)}`;
    if (value === "null") return;

    return enc.Utf8.stringify(enc.Base64.parse(value));
  }

  set(value: string): void {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      enc.Base64.stringify(enc.Utf8.parse(value))
    );
  }
}

const ls = new Localstorage();

let req = new Request({ baseURL: baseURL + "/api" });

// request main storages
async function getRegistryChannelsPools(): Promise<{
  chainRegistry: NetworkData[];
  ibcChannels: IbcResponse[];
  pools: [string, AssetDescription[]][];
}> {
  try {
    const res: {
      chainRegistry: NetworkData[];
      ibcChannels: IbcResponse[];
      pools: [string, AssetDescription[]][];
    } = await req.get("/filter-chain-registry");

    return res;
  } catch (error) {
    return { chainRegistry: [], ibcChannels: [], pools: [] };
  }
}

// request pools to update asset prices
async function getPools(): Promise<[string, AssetDescription[]][]> {
  try {
    return await req.get("/get-pools");
  } catch (error) {
    return [];
  }
}

// request validator list for all networks
async function getValidators(): Promise<
  [string, ValidatorResponseReduced[]][]
> {
  try {
    return await req.get("/get-validators");
  } catch (error) {
    return [];
  }
}

// request funds for all networks for given user osmo address
async function getUserFunds(
  userOsmoAddress: string
): Promise<[string, UserBalance][]> {
  try {
    return await req.get("/get-user-funds", {
      params: {
        userOsmoAddress,
      },
    });
  } catch (error) {
    return [];
  }
}

// request all data for given user osmo address (for user funds)
async function getAll(userOsmoAddress: string): Promise<{
  activeNetworks: PoolExtracted[];
  chainRegistry: NetworkData[];
  ibcChannels: IbcResponse[];
  pools: [string, AssetDescription[]][];
  validatorsStorage: [string, ValidatorResponseReduced[]][];
  userFunds: [string, UserBalance][];
}> {
  try {
    return await req.get("/get-all", {
      params: {
        userOsmoAddress,
      },
    });
  } catch (error) {}
}

async function initAll() {
  try {
    const address = ls.get();
    addressStorage.set(address);
    const data = await getAll(address);
    l({ data });

    // order matters!
    validatorsStorage.set(data.validatorsStorage);
    poolsStorage.set(data.pools);
    console.log("1");
    chainRegistryStorage.set(data.chainRegistry);
    // TODO: increase data update freq
    userFundsStorage.set(data.userFunds);
    l(get(chainRegistryStorage), CHAIN_TYPE, address);
    const { queryUser } = await init(get(chainRegistryStorage), CHAIN_TYPE);

    const { user } = await queryUser(address);
    userContractStorage.set(user);
    l({ user });

    // init assetListStorage
    let assetList: AssetListItem[] = [];

    for (const asset of user?.asset_list) {
      const registryItem = get(chainRegistryStorage).find(({ denomIbc }) => {
        if (!denomIbc && asset.asset_denom === "uosmo") return true;
        return denomIbc === asset.asset_denom;
      });
      if (!registryItem) continue;

      const { prefix, symbol, img } = registryItem;
      const assetListItem: AssetListItem = {
        address: getAddrByPrefix(get(addressStorage), prefix),
        asset: { symbol, logo: img },
        ratio: +asset.weight * 100,
        validator: getValidatorListBySymbol(symbol)[0].operator_address,
      };

      assetList.push(assetListItem);
    }

    assetListStorage.set(sortAssets(assetList));
  } catch (error) {
    l(error);
  }
}

export {
  STABLECOIN_SYMBOL,
  STABLECOIN_EXPONENT,
  LOCAL_STORAGE_KEY,
  START_TIME_CONTRACT,
  PERIOD_CONTRACT,
  DAPP_ADDR,
  CHAIN_TYPE,
  chainRegistryStorage,
  ibcChannellsStorage,
  poolsStorage,
  validatorsStorage,
  userFundsStorage,
  userContractStorage,
  assetListStorage,
  authzHandlerListStorage,
  addressStorage,
  sortingConfigStorage,
  isModalActiveStorage,
  txResStorage,
  currenChain,
  ls,
  getRegistryChannelsPools,
  getPools,
  getValidators,
  getUserFunds,
  getAll,
  initAll,
};
