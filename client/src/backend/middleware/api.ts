import { init } from "../../common/workers/testnet-backend-workers";
import { l } from "../../common/utils";
import { initStorage } from "../storages";
import {
  ChainRegistryStorage,
  IbcChannelsStorage,
  PoolsStorage,
  ValidatorsStorage,
  UserFundsStorage,
  PoolsAndUsersStorage,
} from "../../common/helpers/interfaces";
import {
  getChainRegistry as _getChainRegistry,
  getIbcChannnels as _getIbcChannnels,
  getPools as _getPools,
  getValidators as _getValidators,
  getUserFunds as _getUserFunds,
  filterChainRegistry as _filterChainRegistry,
  mergeChainRegistry,
  mergeIbcChannels,
  mergePools,
} from "../../common/helpers/api-helpers";

// client specific storages
let chainRegistryStorage = initStorage<ChainRegistryStorage>(
  "chain-registry-storage"
);
let ibcChannelsStorage = initStorage<IbcChannelsStorage>(
  "ibc-channels-storage"
);
let poolsStorage = initStorage<PoolsStorage>("pools-storage");
let validatorsStorage = initStorage<ValidatorsStorage>("validators-storage");
let userFundsStorage = initStorage<UserFundsStorage>("user-funds-storage");
// contract specific storage
let poolsAndUsersStorage = initStorage<PoolsAndUsersStorage>(
  "pools-and-users-storage"
);

async function updateChainRegistry() {
  let isStorageUpdated = false;

  try {
    const res = mergeChainRegistry(
      chainRegistryStorage.get(),
      await _getChainRegistry()
    );

    chainRegistryStorage.set(res);
    chainRegistryStorage.write(res);
    isStorageUpdated = true;
  } catch (error) {}

  return { fn: "updateChainRegistry", isStorageUpdated };
}

async function getChainRegistry() {
  const { activeNetworks, chainRegistry, ibcChannels, pools } =
    _filterChainRegistry(
      chainRegistryStorage.get(),
      ibcChannelsStorage.get(),
      poolsStorage.get(),
      validatorsStorage.get()
    );
  return chainRegistry;
}

async function updateIbcChannels() {
  let isStorageUpdated = false;

  try {
    const res = mergeIbcChannels(
      ibcChannelsStorage.get(),
      await _getIbcChannnels()
    );

    ibcChannelsStorage.set(res);
    ibcChannelsStorage.write(res);
    isStorageUpdated = true;
  } catch (error) {
    l(error);
  }

  return { fn: "updateIbcChannels", isStorageUpdated };
}

async function getIbcChannnels() {
  const { activeNetworks, chainRegistry, ibcChannels, pools } =
    _filterChainRegistry(
      chainRegistryStorage.get(),
      ibcChannelsStorage.get(),
      poolsStorage.get(),
      validatorsStorage.get()
    );
  return ibcChannels;
}

async function updatePools() {
  let isStorageUpdated = false;

  try {
    const res = mergePools(poolsStorage.get(), await _getPools());

    poolsStorage.set(res);
    poolsStorage.write(res);
    isStorageUpdated = true;
  } catch (error) {}

  return { fn: "updatePools", isStorageUpdated };
}

async function getPools() {
  const { activeNetworks, chainRegistry, ibcChannels, pools } =
    _filterChainRegistry(
      chainRegistryStorage.get(),
      ibcChannelsStorage.get(),
      poolsStorage.get(),
      validatorsStorage.get()
    );
  return pools;
}

async function updateValidators() {
  let isStorageUpdated = false;

  try {
    const res = await _getValidators();
    validatorsStorage.set(res);
    validatorsStorage.write(res);
    isStorageUpdated = true;
  } catch (error) {}

  return { fn: "updateValidators", isStorageUpdated };
}

async function getValidators() {
  return validatorsStorage.get();
}

// transforms contract response to all users address-balance list
async function updateUserFunds() {
  let isStorageUpdated = false;

  try {
    const res: UserFundsStorage = (
      await _getUserFunds(poolsAndUsersStorage.get())
    ).map(({ address, holded, staked }) => [address, { holded, staked }]);
    userFundsStorage.set(res);
    userFundsStorage.write(res);
    isStorageUpdated = true;
  } catch (error) {}

  return { fn: "updateUserFunds", isStorageUpdated };
}

// filters all users address-balance list by specified user osmo address
async function getUserFunds(userOsmoAddress: string) {
  const userAssets = poolsAndUsersStorage
    .get()
    .users.find(({ osmo_address }) => osmo_address === userOsmoAddress);
  if (!userAssets) return [];

  const addressList = userAssets.asset_list.map(
    ({ wallet_address }) => wallet_address
  );

  return userFundsStorage
    .get()
    .filter(([address]) => addressList.includes(address));
}

async function updatePoolsAndUsers() {
  let isStorageUpdated = false;
  const { cwQueryPoolsAndUsers } = await init();

  try {
    const res = await cwQueryPoolsAndUsers();
    poolsAndUsersStorage.set(res);
    poolsAndUsersStorage.write(res);
    isStorageUpdated = true;
  } catch (error) {}

  return { fn: "updatePoolsAndUsers", isStorageUpdated };
}

async function getPoolsAndUsers() {
  return poolsAndUsersStorage.get();
}

async function filterChainRegistry() {
  return _filterChainRegistry(
    chainRegistryStorage.get(),
    ibcChannelsStorage.get(),
    poolsStorage.get(),
    validatorsStorage.get()
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
      chainRegistryStorage.get(),
      ibcChannelsStorage.get(),
      poolsStorage.get(),
      validatorsStorage.get()
    );

  let userFunds = await getUserFunds(userOsmoAddress);

  return {
    activeNetworks,
    chainRegistry,
    ibcChannels,
    pools,
    validatorsStorage: validatorsStorage.get(),
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
