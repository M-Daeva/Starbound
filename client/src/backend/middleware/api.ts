import { getChainRegistry } from "../../common/helpers/api-helpers";
import type { NetworkData } from "../../common/helpers/interfaces";

// simple caching
let chainRegistryStorage: NetworkData[] = [];

async function _updateChainRegistryGetHandler() {
  let isStorageUpdated = false;
  try {
    chainRegistryStorage = await getChainRegistry();
    isStorageUpdated = true;
  } catch (error) {}

  return isStorageUpdated;
}

function _chainRegistryGetHandler() {
  return chainRegistryStorage;
}

export { _updateChainRegistryGetHandler, _chainRegistryGetHandler };
