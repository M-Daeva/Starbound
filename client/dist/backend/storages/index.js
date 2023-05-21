"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Storage = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
class Storage {
    constructor(name) {
        this.name = name;
        this.encoding = "utf8";
        try {
            (0, fs_1.accessSync)(this.getPath(this.name));
            this.st = this.read();
        }
        catch (error) { }
    }
    get() {
        return this.st;
    }
    set(data) {
        this.st = data;
    }
    read() {
        return JSON.parse((0, fs_1.readFileSync)(this.getPath(this.name), { encoding: this.encoding }));
    }
    write(data) {
        (0, fs_1.writeFileSync)(this.getPath(this.name), JSON.stringify(data), {
            encoding: this.encoding,
        });
    }
    getPath(name) {
        return path_1.default.resolve(__dirname, `./${name}.json`);
    }
}
exports.Storage = Storage;
