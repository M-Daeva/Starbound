import {
  getValidators,
  updatePoolsAndUsers,
} from "../src/backend/account/mainnet-api-workers";

async function main() {
  await getValidators();
  await updatePoolsAndUsers();
}

main();
