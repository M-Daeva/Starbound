import { access, readFile } from "fs/promises";
import { rootPath, decrypt, l } from "../../common/utils";

async function getSeed(seedEncrypted: string): Promise<string> {
  const keyPath = rootPath("../../.test-wallets/key");

  try {
    await access(keyPath);
    const encryptionKey = await readFile(keyPath, { encoding: "utf-8" });
    const seed = decrypt(seedEncrypted, encryptionKey);
    if (!seed) throw new Error("Can not get seed!");
    return seed;
  } catch (error) {
    l(error);
    return "";
  }
}

export { getSeed };
