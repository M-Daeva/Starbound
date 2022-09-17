import {
  getData,
  SigningCosmWasmClient,
  SigningStargateClient,
} from "./osmo-signer";
import {
  initWithSigningStargateClient,
  initWithSigningCosmWasmClient,
} from "./helpers";
const { ADDR, getAliceClient, getBobClient, CONTR } = getData(true);

async function main() {
  // const aliceClient = (await getAliceClient(false)) as SigningStargateClient;
  // const bobClient = (await getBobClient(false)) as SigningStargateClient;

  const aliceCosmWasmClient = (await getAliceClient(
    true
  )) as SigningCosmWasmClient;
  const { deposit, getBankBalance, swap } =
    initWithSigningCosmWasmClient(aliceCosmWasmClient);

  await getBankBalance();
  await deposit();
  await getBankBalance();
  await swap();
  await getBankBalance();
}

main();
