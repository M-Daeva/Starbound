"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initStorage = void 0;
const fs_1 = require("fs");
const utils_1 = require("../../common/utils");
const encoding = "utf8";
function _getPath(name) {
    return (0, utils_1.rootPath)(`./src/backend/storages/${name}.json`);
}
function _readDecorator(name) {
    return () => JSON.parse((0, fs_1.readFileSync)(_getPath(name), { encoding }));
}
function _writeDecorator(name) {
    return (data) => {
        return (0, fs_1.writeFileSync)(_getPath(name), JSON.stringify(data), { encoding });
    };
}
function initStorage(name) {
    let st;
    const read = _readDecorator(name);
    const write = _writeDecorator(name);
    try {
        (0, fs_1.accessSync)(_getPath(name));
        st = read();
    }
    catch (error) { }
    const get = () => st;
    const set = (data) => {
        st = data;
    };
    return {
        read,
        write,
        get,
        set,
    };
}
exports.initStorage = initStorage;
