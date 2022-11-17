import {
  getChainRegistry as _getChainRegistry,
  getIbcChannnels as _getIbcChannnels,
  getPools as _getPools,
  getValidators as _getValidators,
  getUserFunds,
} from "../../common/helpers/api-helpers";
import type {
  NetworkData,
  PoolExtracted,
  ValidatorResponse,
  IbcResponse,
  AssetDescription,
} from "../../common/helpers/interfaces";
import { l } from "../../common/utils";

// simple caching
let chainRegistryStorage: NetworkData[] = [];
let ibcChannellsStorage: IbcResponse[] = [];
let poolsStorage: [string, AssetDescription[]][] = [];
let validatorsStorage: [string, ValidatorResponse[]][] = [];

async function updateChainRegistry() {
  let isStorageUpdated = false;

  try {
    chainRegistryStorage = await _getChainRegistry();
    isStorageUpdated = true;
  } catch (error) {}

  return isStorageUpdated;
}

async function getChainRegistry() {
  return chainRegistryStorage;
}

async function updateIbcChannels() {
  let isStorageUpdated = false;

  try {
    ibcChannellsStorage = await _getIbcChannnels();
    isStorageUpdated = true;
  } catch (error) {
    l(error);
  }

  return isStorageUpdated;
}

async function getIbcChannnels() {
  return ibcChannellsStorage;
}

async function updatePools() {
  let isStorageUpdated = false;

  try {
    poolsStorage = await _getPools();
    isStorageUpdated = true;
  } catch (error) {}

  return isStorageUpdated;
}

async function getPools() {
  return poolsStorage;
}

async function updateValidators() {
  let isStorageUpdated = false;

  try {
    validatorsStorage = await _getValidators();
    isStorageUpdated = true;
  } catch (error) {}

  return isStorageUpdated;
}

async function getValidators() {
  return validatorsStorage;
}

export {
  updateChainRegistry,
  getChainRegistry,
  updateIbcChannels,
  getIbcChannnels,
  updatePools,
  getPools,
  updateValidators,
  getValidators,
  getUserFunds,
};
