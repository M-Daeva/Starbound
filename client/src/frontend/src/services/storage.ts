import type {
  NetworkData,
  IbcResponse,
  AssetDescription,
  ValidatorResponse,
  AssetListItem,
  AuthzHandler,
  CwHandler,
  UserBalance,
  PoolExtracted,
} from "../../../common/helpers/interfaces";
import { type Writable, get, writable } from "svelte/store";
import { createRequest, l } from "../../../common/utils";
import { baseURL } from "../config";

// TODO: replace some writable storages with readable

// api storages
let chainRegistryStorage: Writable<NetworkData[]> = writable([]);
let ibcChannellsStorage: Writable<IbcResponse[]> = writable([]);
let poolsStorage: Writable<[string, AssetDescription[]][]> = writable([]);
let validatorsStorage: Writable<[string, ValidatorResponse[]][]> = writable([]);
let userFundsStorage: Writable<[string, UserBalance][]> = writable([]);

// frontend storages

// assets from asset page
let assetListStorage: Writable<AssetListItem[]> = writable([]);
// multichain grant and revoke handlers
let authzHandlerListStorage: Writable<AuthzHandler[]> = writable([]);
// osmosis address and contract handlers
let cwHandlerStorage: Writable<CwHandler> = writable();
// assets sorting config
let sortingConfigStorage: Writable<{
  key: keyof AssetListItem;
  order: "asc" | "desc";
}> = writable({ key: "address", order: "asc" });

let req = createRequest({ baseURL: baseURL + "/api" });

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
    const data = await getAll(get(cwHandlerStorage).address);
    l({ data });

    // order matters!
    validatorsStorage.set(data.validatorsStorage);
    poolsStorage.set(data.pools);
    chainRegistryStorage.set(data.chainRegistry);
    userFundsStorage.set(data.userFunds);
  } catch (error) {
    l(error);
  }
}

export {
  chainRegistryStorage,
  ibcChannellsStorage,
  poolsStorage,
  validatorsStorage,
  userFundsStorage,
  assetListStorage,
  authzHandlerListStorage,
  cwHandlerStorage,
  sortingConfigStorage,
  getRegistryChannelsPools,
  getPools,
  getValidators,
  getUserFunds,
  getAll,
  initAll,
};
