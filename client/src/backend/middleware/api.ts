import {
  getChainRegistry,
  requestUserFunds,
  getActiveNetworksInfo,
  _requestValidators,
} from "../../common/helpers/api-helpers";
import type {
  NetworkData,
  PoolExtracted,
  ValidatorResponse,
} from "../../common/helpers/interfaces";
import { l } from "../../common/utils";

// simple caching
let chainRegistryStorage: NetworkData[] = [];
let activeNetworksInfoStorage: PoolExtracted[] = [];
let validatorListStorage: [string, ValidatorResponse[]][] = [];

async function _updateChainRegistryGetHandler() {
  let isStorageUpdated = false;
  try {
    chainRegistryStorage = await getChainRegistry();
    isStorageUpdated = true;
  } catch (error) {}

  return isStorageUpdated;
}

async function _chainRegistryGetHandler() {
  return chainRegistryStorage;
}

async function _updateActiveNetworksInfoGetHandler() {
  let isStorageUpdated = false;
  try {
    activeNetworksInfoStorage = await getActiveNetworksInfo();
    isStorageUpdated = true;
  } catch (error) {
    l(error);
  }

  return isStorageUpdated;
}

async function _getActiveNetworksInfoGetHandler() {
  return activeNetworksInfoStorage;
}

async function _updateValidatorsGetHandler() {
  let isStorageUpdated = false;
  try {
    validatorListStorage = await _requestValidators();
    isStorageUpdated = true;
  } catch (error) {}

  return isStorageUpdated;
}

async function _getValidatorsGetHandler() {
  return validatorListStorage;
}

export {
  _updateChainRegistryGetHandler,
  _chainRegistryGetHandler,
  _updateActiveNetworksInfoGetHandler,
  _getActiveNetworksInfoGetHandler,
  _updateValidatorsGetHandler,
  _getValidatorsGetHandler,
  requestUserFunds as _requestUserFundsGetHandler,
};
