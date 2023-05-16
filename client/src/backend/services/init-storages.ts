import { l } from "../../common/utils";
import { updateAll } from "../middleware/api";
import { getSeed } from "./get-seed";
import { SEED_DAPP } from "../../common/config/testnet-config.json";

async function initStorages() {
  try {
    const t = Date.now();
    const res = await updateAll(await getSeed(SEED_DAPP));
    const delta = (Date.now() - t) / 1e3;
    const minutes = Math.floor(delta / 60);
    const seconds = Math.floor(delta % 60);
    l("\n", res, "\n");
    l("\n", `${minutes} minutes ${seconds} seconds`, "\n");
  } catch (error) {
    l(error);
  }
}

initStorages();
