import { decrypt, rootPath, getLast } from "../../common/utils";
import { readFile, writeFile } from "fs/promises";

async function readDecryptWrite(path: string, key: string) {
  const src = await readFile(rootPath(path), { encoding: "utf-8" });
  const decrypted = decrypt(src, key);
  if (!decrypted) return;

  const [prefix, postfix] = path.split(".");
  const [name] = prefix.split("_");
  await writeFile(rootPath(`${name}.${postfix}`), decrypted);
}

(async () => {
  const key = getLast(process.argv).trim();
  await Promise.all(
    ["server_enc.cert", "server_enc.key"].map((item) =>
      readDecryptWrite(item, key)
    )
  );
})();
