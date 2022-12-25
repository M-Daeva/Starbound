import { type Writable, get, writable } from "svelte/store";
import { createRequest, l } from "../../../common/utils";
import { baseURL } from "../config";
import { queryUser } from "./wallet";
import { displayModal } from "./helpers";
import type {
  PoolExtracted,
  User,
} from "../../../common/codegen/Starbound.types";
import type {
  NetworkData,
  IbcResponse,
  AssetDescription,
  ValidatorResponse,
  AssetListItem,
  AuthzHandler,
  UserBalance,
} from "../../../common/helpers/interfaces";

// global constants
const STABLECOIN_SYMBOL = "EEUR";
const STABLECOIN_EXPONENT = 6; // axelar USDC/ e-money EEUR

const LOCAL_STORAGE_KEY = "starbound-osmo-address";

const TARGET_HOUR = 19;

// TODO: replace some writable storages with readable

// api storages
let chainRegistryStorage: Writable<NetworkData[]> = writable([]);
let ibcChannellsStorage: Writable<IbcResponse[]> = writable([]);
let poolsStorage: Writable<[string, AssetDescription[]][]> = writable([]);
let validatorsStorage: Writable<[string, ValidatorResponse[]][]> = writable([]);
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
let txHashStorage: Writable<string> = writable("");

let req = createRequest({ baseURL: baseURL + "/api" });

async function setUserContractStorage() {
  const address = get(addressStorage);
  if (!address) return "";
  const { user } = await queryUser(address);
  userContractStorage.set(user);
}

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
async function getValidators(): Promise<[string, ValidatorResponse[]][]> {
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
  validatorsStorage: [string, ValidatorResponse[]][];
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
    const address = localStorage.getItem(LOCAL_STORAGE_KEY);
    addressStorage.set(address);
    const data = await getAll(address);
    l({ data });

    // order matters!
    validatorsStorage.set(data.validatorsStorage);
    poolsStorage.set(data.pools);
    chainRegistryStorage.set(data.chainRegistry);
    userFundsStorage.set(data.userFunds);

    const { user } = await queryUser(address);
    userContractStorage.set(user);
  } catch (error) {
    l(error);
  }
}

export {
  STABLECOIN_SYMBOL,
  STABLECOIN_EXPONENT,
  LOCAL_STORAGE_KEY,
  TARGET_HOUR,
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
  txHashStorage,
  setUserContractStorage,
  getRegistryChannelsPools,
  getPools,
  getValidators,
  getUserFunds,
  getAll,
  initAll,
};
