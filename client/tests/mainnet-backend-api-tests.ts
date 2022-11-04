import {
  requestValidators,
  updatePoolsAndUsers,
} from "../src/common/workers/mainnet-api-workers";

async function main() {
  await requestValidators();
  await updatePoolsAndUsers();
}

main();
