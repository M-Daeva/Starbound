import { StorageNames, StorageTypes } from "../../common/interfaces";
declare class Storage<T extends StorageTypes> {
    private name;
    private encoding;
    private st;
    constructor(name: StorageNames);
    get(): T | undefined;
    set(data: T): void;
    read(): any;
    write(data: T): void;
    private getPath;
}
export { Storage };
