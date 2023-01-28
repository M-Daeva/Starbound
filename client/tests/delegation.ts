import { init } from "../src/common/workers/testnet-backend-workers";
import { _getAllGrants } from "../src/common/helpers/api-helpers";
import { initStorage } from "../src/backend/storages";
import { l } from "../src/common/utils";
import { ChainRegistryStorage } from "../src/common/helpers/interfaces";

const dappAddress = "osmo18tnvnwkklyv4dyuj8x357n7vray4v4zupj6xjt";
const chainType: "main" | "test" = "test";
const chainRegistryStorage = initStorage<ChainRegistryStorage>(
  "chain-registry-storage"
);

async function main() {
  const { sgDelegateFromAll } = await init();

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
