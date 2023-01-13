import { type Writable, get, writable } from "svelte/store";
import { createRequest, l } from "../../../common/utils";
import { baseURL } from "../config";
import { init } from "./wallet";
import { getValidatorListBySymbol, sortAssets } from "./helpers";
import { getAddrByPrefix } from "../../../common/signers";
import type {
  PoolExtracted,
  User,
} from "../../../common/codegen/Starbound.types";
import type {
  NetworkData,
  IbcResponse,
  AssetDescription,
  ValidatorResponseReduced,
  AssetListItem,
  AuthzHandler,
  UserBalance,
} from "../../../common/helpers/interfaces";

// global constants
const STABLECOIN_SYMBOL = "EEUR";
const STABLECOIN_EXPONENT = 6; // axelar USDC/ e-money EEUR

const LOCAL_STORAGE_KEY = "starbound-osmo-address";

const TARGET_HOUR = 19;

const DAPP_ADDR = "osmo18tnvnwkklyv4dyuj8x357n7vray4v4zupj6xjt";
// TODO: change on mainnet
const CHAIN_TYPE: "main" | "test" = "test";

// TODO: replace some writable storages with readable

// api storages
let chainRegistryStorage: Writable<NetworkData[]> = writable([]);
let ibcChannellsStorage: Writable<IbcResponse[]> = writable([]);
let poolsStorage: Writable<[string, AssetDescription[]][]> = writable([]);
let validatorsStorage: Writable<[string, ValidatorResponseReduced[]][]> =
  writable([]);
let userFundsStorage: Writable<[string, UserBalance][]> = writable([]);

// contract storages
let userContractStorage: Writable<User> = writable();

// frontend storages
// assets from asset page
let assetListStorage: Writable<AssetListItem[]> = writable([]);
// multichain grant and revoke handlers
let authzHandlerListStorage: Writable<AuthzHandler[]> = writable([]);
// osmosis address
let addressStorage: Writable<string> = writable();
// assets sorting config
let sortingConfigStorage: Writable<{
  key: keyof AssetListItem;
  order: "asc" | "desc";
}> = writable({ key: "address", order: "asc" });
// controls tx hash modal
let isModalActiveStorage: Writable<boolean> = writable(false);
// keeps last tx hash
let txHashStorage: Writable<string> = writable("");

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
async function getValidators(): Promise<
  [string, ValidatorResponseReduced[]][]
> {
  try {
    return await req.get("/get-validators");
  } catch (error) {
    return [];
  }
}

// request funds for all networks for given user osmo address
async function getUserFunds(
  userOsmoAddress: string
): Promise<[string, UserBalance][]> {
  try {
    return await req.get("/get-user-funds", {
      params: {
        userOsmoAddress,
      },
    });
  } catch (error) {
    return [];
  }
}

// request all data for given user osmo address (for user funds)
async function getAll(userOsmoAddress: string): Promise<{
  activeNetworks: PoolExtracted[];
  chainRegistry: NetworkData[];
  ibcChannels: IbcResponse[];
  pools: [string, AssetDescription[]][];
  validatorsStorage: [string, ValidatorResponseReduced[]][];
  userFunds: [string, UserBalance][];
}> {
  try {
    return await req.get("/get-all", {
      params: {
        userOsmoAddress,
      },
    });
  } catch (error) {}
}

async function initAll() {
  try {
    const address = localStorage.getItem(LOCAL_STORAGE_KEY);
    addressStorage.set(address);
    const data = await getAll(address);
    l({ data });

    // order matters!
    validatorsStorage.set(data.validatorsStorage);
    poolsStorage.set(data.pools);
    chainRegistryStorage.set(data.chainRegistry);
    userFundsStorage.set(data.userFunds);
    l(get(chainRegistryStorage), CHAIN_TYPE, address);
    const { queryUser } = await init(get(chainRegistryStorage), CHAIN_TYPE);

    const { user } = await queryUser(address);
    userContractStorage.set(user);
    l({ user });
    // init assetListStorage
    let assetList: AssetListItem[] = [];

    for (let asset of user?.asset_list) {
      const registryItem = get(chainRegistryStorage).find(
        ({ denomIbc }) => denomIbc === asset.asset_denom
      );
      if (!registryItem) continue;

      const { prefix, symbol, img } = registryItem;
      const assetListItem: AssetListItem = {
        address: getAddrByPrefix(get(addressStorage), prefix),
        asset: { symbol, logo: img },
        ratio: +asset.weight * 100,
        validator: getValidatorListBySymbol(symbol)[0].operator_address,
      };

      assetList.push(assetListItem);
    }

    assetListStorage.set(sortAssets(assetList));
  } catch (error) {
    l(error);
  }
}

export {
  STABLECOIN_SYMBOL,
  STABLECOIN_EXPONENT,
  LOCAL_STORAGE_KEY,
  TARGET_HOUR,
  DAPP_ADDR,
  CHAIN_TYPE,
  chainRegistryStorage,
  ibcChannellsStorage,
  poolsStorage,
  validatorsStorage,
  userFundsStorage,
  userContractStorage,
  assetListStorage,
  authzHandlerListStorage,
  addressStorage,
  sortingConfigStorage,
  isModalActiveStorage,
  txHashStorage,
  getRegistryChannelsPools,
  getPools,
  getValidators,
  getUserFunds,
  getAll,
  initAll,
};
