import { StorageNames, StorageTypes } from "../../common/helpers/interfaces";
declare function initStorage<T extends StorageTypes>(name: StorageNames): {
    read: () => T | undefined;
    write: (data: T) => void;
    get: () => T | undefined;
    set: (data: T) => void;
};
export { initStorage };
