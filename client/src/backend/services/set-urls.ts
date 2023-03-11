import { readFile, access, writeFile } from "fs/promises";
import { BASE_URL } from "../envs";
import { rootPath } from "../../common/utils";

async function main() {
  const configFilePath = rootPath("./src/frontend/src/config/index.ts");
  await access(configFilePath);
  let configFile = await readFile(configFilePath, { encoding: "utf-8" });
  configFile = configFile
    .replace(/const devUrl = "[^"]*";/, `const devUrl = "${BASE_URL.DEV}";`)
    .replace(
      /const prodUrl = "[^"]*";/,
      `const prodUrl = "${BASE_URL.PROXY}";`
    );
  await writeFile(configFilePath, configFile);
}

main();
