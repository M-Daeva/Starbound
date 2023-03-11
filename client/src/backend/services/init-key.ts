import { l, createRequest, rootPath, getLast } from "../../common/utils";
import { readFile, access } from "fs/promises";
import readline from "readline/promises";
import { BASE_URL } from "../envs";

const isProduction = getLast(process.argv).trim() === "production";
const baseURL = isProduction ? BASE_URL.PROXY : BASE_URL.DEV;
const req = createRequest({ baseURL: baseURL + "/key" });

async function initKey() {
  const keyPath = rootPath("../../.test-wallets/key");
  let encryptionKey = "";

  try {
    await access(keyPath);
    encryptionKey = await readFile(keyPath, { encoding: "utf-8" });
  } catch (error) {
    const inquirer = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    encryptionKey = await inquirer.question("Enter encryption key\n");
    inquirer.close();
  }

  try {
    const res: string = await req.post("/set", { encryptionKey });
    l(res);
  } catch (error) {
    l(error);
  }
}

initKey();
