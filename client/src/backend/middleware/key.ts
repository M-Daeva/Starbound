import { initStorage } from "../storages";
import { EncryptionKeyStorage } from "../../common/helpers/interfaces";
import { decrypt } from "../../common/utils";
import { getSgClient } from "../../common/signers";
import { SEED_DAPP } from "../../common/config/testnet-config.json";
import E from "../config";

let _encryptionKeyStorage = initStorage<EncryptionKeyStorage>(
  "encryption-key-storage"
);

function getEncryptionKey() {
  return _encryptionKeyStorage.get();
}

async function setEncryptionKey(value: string): Promise<string> {
  try {
    // skip if key specified
    if (_encryptionKeyStorage.get()) {
      throw new Error(`Key is already specified!`);
    }

    // skip if key is wrong
    const seed = decrypt(SEED_DAPP, value);
    if (!seed) throw new Error(`Key '${value}' is wrong!`);

    const { owner } = await getSgClient({
      prefix: "osmo",
      RPC: "https://rpc.osmosis.zone:443",
      seed,
    });

    if (owner !== E.DAPP_ADDRESS) throw new Error(`Key '${value}' is wrong!`);

    _encryptionKeyStorage.set(value);

    return "Success!";
  } catch (error) {
    return `${error}`;
  }
}

export { getEncryptionKey, setEncryptionKey };
