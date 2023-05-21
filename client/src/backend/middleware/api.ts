import { init } from "../account/testnet-backend-workers";
import { l } from "../../common/utils";
import { Storage } from "../storages";
import { CHAIN_TYPE } from "../envs"; // TODO: change on mainnet
import {
  ChainRegistryStorage,
  IbcChannelsStorage,
  PoolsStorage,
  ValidatorsStorage,
  UserFundsStorage,
  PoolsAndUsersStorage,
} from "../../common/interfaces";
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
} from "../helpers";

const allowList: [string, string, string[]][] = [
  ["secret", "test", ["https://rpc.pulsar.scrttestnet.com/"]],
];
const ignoreList: [string, string, string[]][] = [];

// client specific storages
const chainRegistryStorage = new Storage<ChainRegistryStorage>(
  "chain-registry-storage"
);
const ibcChannelsStorage = new Storage<IbcChannelsStorage>(
  "ibc-channels-storage"
);
const poolsStorage = new Storage<PoolsStorage>("pools-storage");
const validatorsStorage = new Storage<ValidatorsStorage>("validators-storage");
const userFundsStorage = new Storage<UserFundsStorage>("user-funds-storage");
// contract specific storage
const poolsAndUsersStorage = new Storage<PoolsAndUsersStorage>(
  "pools-and-users-storage"
);

async function updateChainRegistry() {
  try {
    const res = mergeChainRegistry(
      chainRegistryStorage.get(),
      await _getChainRegistry(allowList, ignoreList)
    );

    chainRegistryStorage.set(res);
    chainRegistryStorage.write(res);

    return { fn: "updateChainRegistry", updateStatus: "✔️" };
  } catch (error) {
    l(error);

    return { fn: "updateChainRegistry", updateStatus: "❌" };
  }
}

async function getChainRegistry() {
  const { chainRegistry } = _filterChainRegistry(
    chainRegistryStorage.get(),
    ibcChannelsStorage.get(),
    poolsStorage.get(),
    validatorsStorage.get(),
    CHAIN_TYPE
  );
  return chainRegistry;
}

async function updateIbcChannels() {
  try {
    const res = mergeIbcChannels(
      ibcChannelsStorage.get(),
      await _getIbcChannnels(chainRegistryStorage.get(), CHAIN_TYPE)
    );
    if (!res) throw new Error("mergeIbcChannels returned undefined!");

    ibcChannelsStorage.set(res);
    ibcChannelsStorage.write(res);

    return { fn: "updateIbcChannels", updateStatus: "✔️" };
  } catch (error) {
    l(error);

    return { fn: "updateIbcChannels", updateStatus: "❌" };
  }
}

async function getIbcChannnels() {
  const { ibcChannels } = _filterChainRegistry(
    chainRegistryStorage.get(),
    ibcChannelsStorage.get(),
    poolsStorage.get(),
    validatorsStorage.get(),
    CHAIN_TYPE
  );
  return ibcChannels;
}

async function updatePools() {
  try {
    const res = mergePools(poolsStorage.get(), await _getPools());

    poolsStorage.set(res);
    poolsStorage.write(res);

    return { fn: "updatePools", updateStatus: "✔️" };
  } catch (error) {
    l(error);

    return { fn: "updatePools", updateStatus: "❌" };
  }
}

async function getPools() {
  const { pools } = _filterChainRegistry(
    chainRegistryStorage.get(),
    ibcChannelsStorage.get(),
    poolsStorage.get(),
    validatorsStorage.get(),
    CHAIN_TYPE
  );
  return pools;
}

async function updateValidators() {
  try {
    const res = await _getValidators(
      _getChainNameAndRestList(chainRegistryStorage.get(), CHAIN_TYPE)
    );
    if (!res.length) throw new Error("_getValidators returned empty list");

    validatorsStorage.set(res);
    validatorsStorage.write(res);

    return { fn: "updateValidators", updateStatus: "✔️" };
  } catch (error) {
    l(error);

    return { fn: "updateValidators", updateStatus: "❌" };
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
        poolsStorage.get(),
        CHAIN_TYPE
      )
    ).map(({ address, holded, staked }) => [address, { holded, staked }]);
    userFundsStorage.set(res);
    userFundsStorage.write(res);

    return { fn: "updateUserFunds", updateStatus: "✔️" };
  } catch (error) {
    l(error);

    return { fn: "updateUserFunds", updateStatus: "❌" };
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
  try {
    const helpers = await init();
    if (!helpers) throw new Error("Init is failed!");

    const { cwQueryPoolsAndUsers } = helpers;

    const res = await cwQueryPoolsAndUsers();
    poolsAndUsersStorage.set(res);
    poolsAndUsersStorage.write(res);

    return { fn: "updatePoolsAndUsers", updateStatus: "✔️" };
  } catch (error) {
    l(error);

    return { fn: "updatePoolsAndUsers", updateStatus: "❌" };
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
    CHAIN_TYPE
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

async function getAll(userOsmoAddress?: string) {
  const { activeNetworks, chainRegistry, ibcChannels, pools } =
    _filterChainRegistry(
      chainRegistryStorage.get(),
      ibcChannelsStorage.get(),
      poolsStorage.get(),
      validatorsStorage.get(),
      CHAIN_TYPE
    );

  const userFunds = userOsmoAddress ? await getUserFunds(userOsmoAddress) : [];

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
