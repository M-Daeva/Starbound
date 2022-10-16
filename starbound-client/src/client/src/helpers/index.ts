import { SimpleCrypto } from "simple-crypto-js";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import {
  DirectSecp256k1HdWallet,
  OfflineDirectSigner,
} from "@cosmjs/proto-signing";

const enc = (text: string, key: string) => new SimpleCrypto(key).encrypt(text);
const dec = (code: string, key: string) => new SimpleCrypto(key).decrypt(code);

const readFileAsync = async (dir: string): Promise<string> => {
  return (await promisify(fs.readFile)(dir)).toString();
};
const writeFileAsync = promisify(fs.writeFile);
const delay = promisify(setTimeout);

const rootPath = (dir: string) => path.resolve(__dirname, "../../../", dir);

const generateKey = async (dir: string): Promise<void> => {
  const wallet = await DirectSecp256k1HdWallet.generate(24);
  await writeFileAsync(rootPath(dir), wallet.mnemonic);

  const accounts = await wallet.getAccounts();
  console.error("Mnemonic with 1st account:", accounts[0].address);
};

const getSignerFromMnemonic = async (): Promise<OfflineDirectSigner> => {
  const seed = await readFileAsync(rootPath("./keys/user.key"));
  return DirectSecp256k1HdWallet.fromMnemonic(seed, { prefix: "cosmos" });
};

export {
  generateKey,
  readFileAsync,
  writeFileAsync,
  enc,
  dec,
  delay,
  rootPath,
  getSignerFromMnemonic,
};
