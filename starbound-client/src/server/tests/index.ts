import {
  requestValidators,
  updatePoolsAndUsers,
} from "../workers/main-network-workers";
import { init } from "../workers/test-network-workers";

async function main() {
  const { sgDelegateFrom } = await init();

  await requestValidators();
  await updatePoolsAndUsers();
}

main();
