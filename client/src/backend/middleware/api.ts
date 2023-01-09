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

const allowList: [string, string, string[]][] = [
  ["osmo", "test", ["https://rpc-test.osmosis.zone/"]],
];
const ignoreList: [string, string, string[]][] = [];

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
  try {
    const res = mergeChainRegistry(
      chainRegistryStorage.get(),
      await _getChainRegistry(SEED_DAPP, allowList, ignoreList)
    );

    chainRegistryStorage.set(res);
    chainRegistryStorage.write(res);

    return { fn: "updateChainRegistry", isStorageUpdated: true };
  } catch (error) {
    l(error);

    return { fn: "updateChainRegistry", isStorageUpdated: false };
  }
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
  try {
    const res = mergeIbcChannels(
      ibcChannelsStorage.get(),
      await _getIbcChannnels(chainRegistryStorage.get(), chainType)
    );
    if (!res) throw new Error("mergeIbcChannels returned undefined!");

    ibcChannelsStorage.set(res);
    ibcChannelsStorage.write(res);

    return { fn: "updateIbcChannels", isStorageUpdated: true };
  } catch (error) {
    l(error);

    return { fn: "updateIbcChannels", isStorageUpdated: false };
  }
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
  try {
    const res = mergePools(poolsStorage.get(), await _getPools());

    poolsStorage.set(res);
    poolsStorage.write(res);

    return { fn: "updatePools", isStorageUpdated: true };
  } catch (error) {
    l(error);

    return { fn: "updatePools", isStorageUpdated: false };
  }
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
  try {
    const res = await _getValidators(
      _getChainNameAndRestList(chainRegistryStorage.get(), chainType)
    );
    if (!res.length) throw new Error("_getValidators returned empty list");

    validatorsStorage.set(res);
    validatorsStorage.write(res);

    return { fn: "updateValidators", isStorageUpdated: true };
  } catch (error) {
    l(error);

    return { fn: "updateValidators", isStorageUpdated: false };
  }
}

async function getValidators() {
  return validatorsStorage.get();
}

// transforms contract response to all users address-balance list
async function updateUserFunds() {
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

    return { fn: "updateUserFunds", isStorageUpdated: true };
  } catch (error) {
    l(error);

    return { fn: "updateUserFunds", isStorageUpdated: false };
  }
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
  const { cwQueryPoolsAndUsers } = await init();

  try {
    const res = await cwQueryPoolsAndUsers();
    poolsAndUsersStorage.set(res);
    poolsAndUsersStorage.write(res);

    return { fn: "updatePoolsAndUsers", isStorageUpdated: true };
  } catch (error) {
    l(error);

    return { fn: "updatePoolsAndUsers", isStorageUpdated: false };
  }
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
