import { SimpleCrypto } from "simple-crypto-js";
import path from "path";

const enc = (text: string, key: string) => new SimpleCrypto(key).encrypt(text);
const dec = (code: string, key: string) => new SimpleCrypto(key).decrypt(code);

const rootPath = (dir: string) => path.resolve(__dirname, "../../../", dir);

export { enc, dec, rootPath };
