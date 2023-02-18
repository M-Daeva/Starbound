import path from "path";
import { readFileSync, writeFileSync, accessSync } from "fs";
import { StorageNames, StorageTypes } from "../../common/helpers/interfaces";

const encoding = "utf8";

function _getPath(name: string) {
  return path.resolve(__dirname, `./${name}.json`);
}

function _readDecorator<T>(name: string): () => T | undefined {
  return () => JSON.parse(readFileSync(_getPath(name), { encoding }));
}

function _writeDecorator<T>(name: string) {
  return (data: T) => {
    return writeFileSync(_getPath(name), JSON.stringify(data), { encoding });
  };
}

function initStorage<T extends StorageTypes>(name: StorageNames) {
  let st: T | undefined;

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

export { initStorage };
