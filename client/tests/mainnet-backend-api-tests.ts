import {
  getValidators,
  updatePoolsAndUsers,
} from "../src/common/workers/mainnet-api-workers";

async function main() {
  await getValidators();
  await updatePoolsAndUsers();
}

main();
