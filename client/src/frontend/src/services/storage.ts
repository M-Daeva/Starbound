import type {
  NetworkData,
  IbcResponse,
  AssetDescription,
  ValidatorResponse,
  AssetListItem,
  AuthzHandler,
  CwHandler,
  UserBalance,
} from "../../../common/helpers/interfaces";
import type { Coin } from "@cosmjs/stargate";
import { writable } from "svelte/store";
import type { Writable } from "svelte/store";
import { createRequest, l } from "../../../common/utils";
import { baseURL } from "../config";

// api storages
let chainRegistryStorage: Writable<NetworkData[]> = writable([]);
let ibcChannellsStorage: Writable<IbcResponse[]> = writable([]);
let poolsStorage: Writable<[string, AssetDescription[]][]> = writable([]);
let validatorsStorage: Writable<[string, ValidatorResponse[]][]> = writable([]);
let userFundsStorage: Writable<[string, UserBalance][]> = writable([]);

// frontend storages

// to store assets from asset page
let assetListStorage: Writable<AssetListItem[]> = writable([]);
// to store multichain grant and revoke handlers
let authzHandlerListStorage: Writable<AuthzHandler[]> = writable([]);
// to store osmosis address and contract handlers
let cwHandlerStorage: Writable<CwHandler> = writable();

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

// request funds for all networks for given list of different users addresses
async function getUserFunds(
  adresses: string[]
): Promise<[string, UserBalance][]> {
  try {
    return await req.get("/get-user-funds", {
      params: {
        adresses,
      },
    });
  } catch (error) {
    return [];
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
  getRegistryChannelsPools,
  getPools,
  getValidators,
  getUserFunds,
};
