import {
  requestValidators,
  updatePoolsAndUsers,
} from "../../src/common/workers/mainnet-api-workers";
import { init } from "../../src/common/workers/testnet-backend-workers";

async function main() {
  const { sgDelegateFrom } = await init();

  await requestValidators();
  await updatePoolsAndUsers();
}

main();
