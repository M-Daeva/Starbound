import type {
  NetworkData,
  IbcResponse,
  AssetDescription,
  ValidatorResponse,
  AssetListItem,
} from "../../../common/helpers/interfaces";
import type { Coin } from "@cosmjs/stargate";
import { writable } from "svelte/store";
import type { Writable } from "svelte/store";
import { createRequest } from "../../../common/utils";
import { baseURL } from "../config";

// api storages
let chainRegistryStorage: Writable<NetworkData[]> = writable([]);
let ibcChannellsStorage: Writable<IbcResponse[]> = writable([]);
let poolsStorage: Writable<[string, AssetDescription[]][]> = writable([]);
let validatorsStorage: Writable<[string, ValidatorResponse[]][]> = writable([]);
let userFundsStorage: Writable<[string, Coin][]> = writable([]);

// frontend storages
let assetListStorage: Writable<AssetListItem[]> = writable([]);

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

// request user funds for all networks
async function getUserFunds(): Promise<[string, Coin][]> {
  try {
    return await req.get("/get-user-funds");
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
  getRegistryChannelsPools,
  getPools,
  getValidators,
  getUserFunds,
};
