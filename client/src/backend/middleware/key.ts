import { Storage } from "../storages";
import { EncryptionKeyStorage } from "../../common/interfaces";
import { decrypt } from "../../common/utils";
import { getSigner } from "../account/signer";
import { SEED_DAPP } from "../../common/config/osmosis-testnet-config.json";
import { DAPP_ADDRESS } from "../envs";

const RPC = "https://rpc.osmosis.zone:443";
const prefix = "osmo";

const encryptionKeyStorage = new Storage<EncryptionKeyStorage>(
  "encryption-key-storage"
);

function getEncryptionKey() {
  return encryptionKeyStorage.get();
}

async function setEncryptionKey(value: string): Promise<string> {
  try {
    // skip if key specified
    if (encryptionKeyStorage.get()) {
      throw new Error(`⚠️ Encryption key is already specified!`);
    }

    // skip if key is wrong
    const seed = decrypt(SEED_DAPP, value);
    if (!seed) {
      throw new Error(`❌ Encryption key '${value}' is wrong!`);
    }

    const { owner } = await getSigner(RPC, prefix, seed);
    if (owner !== DAPP_ADDRESS) {
      throw new Error(`❌ Encryption key '${value}' is wrong!`);
    }

    encryptionKeyStorage.set(value);

    return "✔️ Encryption key is loaded!\n";
  } catch (error) {
    return `${error}`.split("Error: ")[1];
  }
}

export { getEncryptionKey, setEncryptionKey };
