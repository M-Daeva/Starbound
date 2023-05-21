import { init } from "../src/backend/account/testnet-backend-workers";
import { _getAllGrants } from "../src/backend/helpers";
import { Storage } from "../src/backend/storages";
import { l } from "../src/common/utils";
import { ChainRegistryStorage } from "../src/common/interfaces";
import { getSeed } from "../src/backend/services/get-seed";
import { SEED_DAPP } from "../src/common/config/osmosis-testnet-config.json";

const dappAddress = "osmo18tnvnwkklyv4dyuj8x357n7vray4v4zupj6xjt";
const chainType: "main" | "test" = "test";
const chainRegistryStorage = new Storage<ChainRegistryStorage>(
  "chain-registry-storage"
);

async function main() {
  const helpers = await init(await getSeed(SEED_DAPP));
  if (!helpers) return;

  const { sgDelegateFromAll, owner } = helpers;
  if (!owner) return;

  const grants = await _getAllGrants(
    dappAddress,
    chainRegistryStorage.get(),
    chainType
  );
  if (!grants) return;

  for (const grant of grants) {
    l(grant);
  }

  await sgDelegateFromAll(grants, chainRegistryStorage.get(), chainType);
}

main();
