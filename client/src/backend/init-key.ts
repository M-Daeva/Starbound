import { l, createRequest } from "../common/utils";
import E from "./config";
import { readFile, access } from "fs/promises";
import readline from "readline/promises";
import "./services/ssl-fix";

const req = createRequest({ baseURL: E.BASE_URL + "/key" });

async function initKey() {
  const keyPath = "../../../../.test-wallets/key";
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
