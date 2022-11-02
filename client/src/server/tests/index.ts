import {
  requestValidators,
  updatePoolsAndUsers,
} from "../../common/workers/main-network-workers";
import { init } from "../../common/workers/server-testnet-workers";

async function main() {
  const { sgDelegateFrom } = await init();

  await requestValidators();
  await updatePoolsAndUsers();
}

main();
