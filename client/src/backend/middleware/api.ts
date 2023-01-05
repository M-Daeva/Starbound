import { init } from "../../common/workers/testnet-backend-workers";
import { SEED_DAPP } from "../../common/config/testnet-config.json";
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
  getChainNameAndRestList as _getChainNameAndRestList,
} from "../../common/helpers/api-helpers";

// TODO: change on maiinet
let chainType: "main" | "test" = "test";

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
      await _getChainRegistry(SEED_DAPP)
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
      validatorsStorage.get(),
      chainType
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
      validatorsStorage.get(),
      chainType
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
      validatorsStorage.get(),
      chainType
    );
  return pools;
}

async function updateValidators() {
  let isStorageUpdated = false;

  try {
    const res = await _getValidators(
      _getChainNameAndRestList(chainRegistryStorage.get(), chainType)
    );
    validatorsStorage.set(res);
    validatorsStorage.write(res);
    isStorageUpdated = !!res.length;
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
      await _getUserFunds(
        chainRegistryStorage.get(),
        poolsAndUsersStorage.get(),
        chainType
      )
    ).map(({ address, holded, staked }) => [address, { holded, staked }]);
    userFundsStorage.set(res);
    userFundsStorage.write(res);
    isStorageUpdated = true;
  } catch (error) {}

  return { fn: "updateUserFunds", isStorageUpdated };
}

// filters all users address-balance list by specified user osmo address
async function getUserFunds(userOsmoAddress: string) {
  const poolsAndUsers = poolsAndUsersStorage.get();
  if (!poolsAndUsers) return [];

  const userAssets = poolsAndUsers.users.find(
    ({ osmo_address }) => osmo_address === userOsmoAddress
  );
  if (!userAssets) return [];

  const addressList = userAssets.asset_list.map(
    ({ wallet_address }) => wallet_address
  );

  const userFunds = userFundsStorage.get();
  if (!userFunds) return [];
  return userFunds.filter(([address]) => addressList.includes(address));
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
    validatorsStorage.get(),
    chainType
  );
}

async function updateAll() {
  // request contract data
  const resCw = await updatePoolsAndUsers();

  // process it and request data from other sources
  const resChainRegistry = await updateChainRegistry();
  const res = await Promise.all([
    updateIbcChannels(),
    updatePools(),
    updateValidators(),
    updateUserFunds(),
  ]);

  return [resCw, resChainRegistry, ...res];
}

async function getAll(userOsmoAddress: string) {
  const { activeNetworks, chainRegistry, ibcChannels, pools } =
    _filterChainRegistry(
      chainRegistryStorage.get(),
      ibcChannelsStorage.get(),
      poolsStorage.get(),
      validatorsStorage.get(),
      chainType
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
