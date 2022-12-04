import { init } from "../../common/workers/testnet-backend-workers";
import { l } from "../../common/utils";
import {
  getChainRegistry as _getChainRegistry,
  getIbcChannnels as _getIbcChannnels,
  getPools as _getPools,
  getValidators as _getValidators,
  getUserFunds as _getUserFunds,
  filterChainRegistry as _filterChainRegistry,
} from "../../common/helpers/api-helpers";
import { type QueryPoolsAndUsersResponse } from "../../common/codegen/Starbound.types";
import type {
  NetworkData,
  ValidatorResponse,
  IbcResponse,
  AssetDescription,
  UserBalance,
} from "../../common/helpers/interfaces";

// client specific storages
let chainRegistryStorage: NetworkData[] = [];
let ibcChannellsStorage: IbcResponse[] = [];
let poolsStorage: [string, AssetDescription[]][] = [];
let validatorsStorage: [string, ValidatorResponse[]][] = [];
let userFundsStorage: [string, UserBalance][] = [];
// contract specific storage
let poolsAndUsersStorage: QueryPoolsAndUsersResponse = { pools: [], users: [] };

async function updateChainRegistry() {
  let isStorageUpdated = false;

  try {
    chainRegistryStorage = await _getChainRegistry();
    isStorageUpdated = true;
  } catch (error) {}

  return { fn: "updateChainRegistry", isStorageUpdated };
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

  return { fn: "updateIbcChannels", isStorageUpdated };
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

  return { fn: "updatePools", isStorageUpdated };
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

  return { fn: "updateValidators", isStorageUpdated };
}

async function getValidators() {
  return validatorsStorage;
}

// transforms contract response to all users address-balance list
async function updateUserFunds() {
  let isStorageUpdated = false;

  try {
    userFundsStorage = (await _getUserFunds(poolsAndUsersStorage)).map(
      ({ address, holded, staked }) => [address, { holded, staked }]
    );
    isStorageUpdated = true;
  } catch (error) {}

  return { fn: "updateUserFunds", isStorageUpdated };
}

// filters all users address-balance list by specified user osmo address
async function getUserFunds(userOsmoAddress: string) {
  const userAssets = poolsAndUsersStorage.users.find(
    ({ osmo_address }) => osmo_address === userOsmoAddress
  );
  if (!userAssets) return [];

  const addressList = userAssets.asset_list.map(
    ({ wallet_address }) => wallet_address
  );

  return userFundsStorage.filter(([address]) => addressList.includes(address));
}

async function updatePoolsAndUsers() {
  let isStorageUpdated = false;
  const { cwQueryPoolsAndUsers } = await init();

  try {
    poolsAndUsersStorage = await cwQueryPoolsAndUsers();
    isStorageUpdated = true;
  } catch (error) {}

  return { fn: "updatePoolsAndUsers", isStorageUpdated };
}

async function getPoolsAndUsers() {
  return poolsAndUsersStorage;
}

async function filterChainRegistry() {
  return _filterChainRegistry(
    chainRegistryStorage,
    ibcChannellsStorage,
    poolsStorage,
    validatorsStorage
  );
}

async function updateAll() {
  // request contract data
  const resCw = await updatePoolsAndUsers();

  // process it and request data from other sources
  const res = await Promise.all([
    updateChainRegistry(),
    updateIbcChannels(),
    updatePools(),
    updateValidators(),
    updateUserFunds(),
  ]);

  return [resCw, ...res];
}

async function getAll(userOsmoAddress: string) {
  const { activeNetworks, chainRegistry, ibcChannels, pools } =
    _filterChainRegistry(
      chainRegistryStorage,
      ibcChannellsStorage,
      poolsStorage,
      validatorsStorage
    );

  let userFunds = await getUserFunds(userOsmoAddress);

  return {
    activeNetworks,
    chainRegistry,
    ibcChannels,
    pools,
    validatorsStorage,
    userFunds,
  };
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
  updateAll,
  getAll,
};
