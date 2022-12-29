import { readFileSync, writeFileSync, accessSync } from "fs";
import { QueryPoolsAndUsersResponse } from "../../common/codegen/Starbound.types";
import { rootPath } from "../../common/utils";
import {
  NetworkData,
  ValidatorResponseReduced,
  IbcResponse,
  AssetDescription,
  UserBalance,
} from "../../common/helpers/interfaces";

type StorageNames =
  | "chain-registry-storage"
  | "ibc-channells-storage"
  | "pools-storage"
  | "validators-storage"
  | "user-funds-storage"
  | "pools-and-users-storage";

type ChainRegistryStorage = NetworkData[];
type IbcChannellsStorage = IbcResponse[];
type PoolsStorage = [string, AssetDescription[]][];
type ValidatorsStorage = [string, ValidatorResponseReduced[]][];
type UserFundsStorage = [string, UserBalance][];
type PoolsAndUsersStorage = QueryPoolsAndUsersResponse;

type StorageTypes =
  | ChainRegistryStorage
  | IbcChannellsStorage
  | PoolsStorage
  | ValidatorsStorage
  | UserFundsStorage
  | PoolsAndUsersStorage;

const encoding = "utf8";

function _getPath(name: string) {
  return rootPath(`./src/backend/storages/${name}.json`);
}

function _readDecorator<T>(name: string): () => T {
  return () => JSON.parse(readFileSync(_getPath(name), { encoding }));
}

function _writeDecorator<T>(name: string) {
  return (data: T) => {
    return writeFileSync(_getPath(name), JSON.stringify(data), { encoding });
  };
}

function initStorage<T extends StorageTypes>(name: StorageNames) {
  let st: T;

  const read = _readDecorator<T>(name);
  const write = _writeDecorator<T>(name);

  try {
    accessSync(_getPath(name));
    st = read();
  } catch (error) {}

  const get = () => st;
  const set = (data: T) => {
    st = data;
  };

  return {
    read,
    write,
    get,
    set,
  };
}

export {
  initStorage,
  ChainRegistryStorage,
  IbcChannellsStorage,
  PoolsStorage,
  ValidatorsStorage,
  UserFundsStorage,
  PoolsAndUsersStorage,
};
