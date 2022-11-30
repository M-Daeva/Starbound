import {
  getChainRegistry as _getChainRegistry,
  getIbcChannnels as _getIbcChannnels,
  getPools as _getPools,
  getValidators as _getValidators,
  getUserFunds as _getUserFunds,
  filterChainRegistry as _filterChainRegistry,
} from "../../common/helpers/api-helpers";
import { init } from "../../common/workers/testnet-backend-workers";
import type {
  NetworkData,
  ValidatorResponse,
  IbcResponse,
  AssetDescription,
  UserBalance,
  QueryPoolsAndUsersResponse,
} from "../../common/helpers/interfaces";
import { l } from "../../common/utils";

// simple caching
let chainRegistryStorage: NetworkData[] = [];
let ibcChannellsStorage: IbcResponse[] = [];
let poolsStorage: [string, AssetDescription[]][] = [];
let validatorsStorage: [string, ValidatorResponse[]][] = [];
let userFundsStorage: [string, UserBalance][] = [];
let poolsAndUsersStorage: QueryPoolsAndUsersResponse = { pools: [], users: [] };

async function updateChainRegistry() {
  let isStorageUpdated = false;

  try {
    chainRegistryStorage = await _getChainRegistry();
    isStorageUpdated = true;
  } catch (error) {}

  return isStorageUpdated;
}

async function getChainRegistry() {
  const { activeNetworks, chainRegistry, ibcChannels, pools } =
    _filterChainRegistry(
      chainRegistryStorage,
      ibcChannellsStorage,
      poolsStorage,
      validatorsStorage
    );
  return chainRegistry;
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
  const { activeNetworks, chainRegistry, ibcChannels, pools } =
    _filterChainRegistry(
      chainRegistryStorage,
      ibcChannellsStorage,
      poolsStorage,
      validatorsStorage
    );
  return ibcChannels;
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
  const { activeNetworks, chainRegistry, ibcChannels, pools } =
    _filterChainRegistry(
      chainRegistryStorage,
      ibcChannellsStorage,
      poolsStorage,
      validatorsStorage
    );
  return pools;
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

async function updateUserFunds() {
  let isStorageUpdated = false;

  try {
    userFundsStorage = (await _getUserFunds(poolsAndUsersStorage)).map(
      ({ address, holded, staked }) => [address, { holded, staked }]
    );
    isStorageUpdated = true;
  } catch (error) {}

  return isStorageUpdated;
}

async function getUserFunds() {
  return userFundsStorage;
}

async function filterChainRegistry() {
  return _filterChainRegistry(
    chainRegistryStorage,
    ibcChannellsStorage,
    poolsStorage,
    validatorsStorage
  );
}

async function updatePoolsAndUsers() {
  let isStorageUpdated = false;
  const { cwQueryPoolsAndUsers } = await init();

  try {
    poolsAndUsersStorage = await cwQueryPoolsAndUsers();
    isStorageUpdated = true;
  } catch (error) {}

  return isStorageUpdated;
}

async function getPoolsAndUsers() {
  return poolsAndUsersStorage;
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
  updateUserFunds,
  getUserFunds,
  updatePoolsAndUsers,
  getPoolsAndUsers,
  filterChainRegistry,
};
