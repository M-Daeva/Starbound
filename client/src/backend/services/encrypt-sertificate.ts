import { encrypt, rootPath, getLast } from "../../common/utils";
import { readFile, writeFile } from "fs/promises";

async function readEncryptWrite(path: string, key: string) {
  const src = await readFile(rootPath(path), { encoding: "utf-8" });
  const encrypted = encrypt(src, key);
  const name = getLast(path.split("/"));
  const [prefix, postfix] = name.split(".");
  await writeFile(rootPath(`${prefix}_enc.${postfix}`), encrypted);
}

(async () => {
  const key = getLast(process.argv).trim();
  await Promise.all(
    ["../../.test-wallets/server.cert", "../../.test-wallets/server.key"].map(
      (item) => readEncryptWrite(item, key)
    )
  );
})();
