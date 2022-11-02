/// <reference types="node" />
/// <reference types="node" />
import fs from "fs";
import { OfflineDirectSigner } from "@cosmjs/proto-signing";
declare const enc: (text: string, key: string) => string;
declare const dec: (code: string, key: string) => import("simple-crypto-js").PlainData;
declare const readFileAsync: (dir: string) => Promise<string>;
declare const writeFileAsync: typeof fs.writeFile.__promisify__;
declare const delay: typeof import("timers/promises").setTimeout;
declare const rootPath: (dir: string) => string;
declare const generateKey: (dir: string) => Promise<void>;
declare const getSignerFromMnemonic: () => Promise<OfflineDirectSigner>;
export { generateKey, readFileAsync, writeFileAsync, enc, dec, delay, rootPath, getSignerFromMnemonic, };
