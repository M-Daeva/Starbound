import { init } from "../src/common/workers/testnet-backend-workers";
import { _getAllGrants } from "../src/common/helpers/api-helpers";
import { initStorage } from "../src/backend/storages";
import { l } from "../src/common/utils";
import { ChainRegistryStorage } from "../src/common/helpers/interfaces";
import { getSeed } from "../src/backend/services/get-seed";
import { SEED_DAPP } from "../src/common/config/testnet-config.json";

const dappAddress = "osmo18tnvnwkklyv4dyuj8x357n7vray4v4zupj6xjt";
const chainType: "main" | "test" = "test";
const chainRegistryStorage = initStorage<ChainRegistryStorage>(
  "chain-registry-storage"
);

async function main() {
  const helpers = await init(await getSeed(SEED_DAPP));
  if (!helpers) return;

  const { sgDelegateFromAll } = helpers;

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
