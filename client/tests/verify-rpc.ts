import {
  _verifyRpc,
  _verifyRpcList,
  _getValidatorsNew,
  _verifyRest,
  _verifyRestList,
  getChainRegistry,
} from "../src/common/helpers/api-helpers";
import { ChainRegistryStorage } from "../src/common/helpers/interfaces";
import { initStorage } from "../src/backend/storages";
import { l } from "../src/common/utils";
import { SEED_DAPP } from "../src/common/config/testnet-config.json";

// async function main() {
//   const a = Date.now();

//   let res = await _verifyRpc(
//     [
//       "https://rpc.osmo-test.ccvalidators.com",
//       "https://osmosistest-rpc.quickapi.com/",
//       "https://testnet-rpc.osmosis.zone/",
//     ],
//     "osmo",
//     SEED_DAPP
//   );
//   l(res);

//   l((Date.now() - a) / 1e3);
// }

// async function main() {
//   const a = Date.now();

//   const prefixAndRpcList: [string, string, string[]][] = [
//     [
//       "osmo",
//       "test",
//       [
//         "https://rpc.osmo-test.ccvalidators.com",
//         "https://osmosistest-rpc.quickapi.com/",
//         "https://testnet-rpc.osmosis.zone/",
//       ],
//     ],
//     [
//       "juno",
//       "test",
//       [
//         "https://rpc.uni.junonetwork.io",
//         "https://juno-testnet-rpc.polkachu.com",
//       ],
//     ],
//     [
//       "cosmos",
//       "test",
//       [
//         "https://rpc.sentry-01.theta-testnet.polypore.xyz",
//         // "https://rpc.sentry-02.theta-testnet.polypore.xyz",
//       ],
//     ],
//   ];

//   let res = await _verifyRpcList(prefixAndRpcList, SEED_DAPP);
//   l(res);

//   l((Date.now() - a) / 1e3);
// }

// async function main() {
//   const list = [
//     "https://lcd.osmosis.zone/",
//     "https://osmosis-lcd.quickapi.com:443",
//     "https://lcd-osmosis.whispernode.com",
//   ];

//   try {
//     const rest = await _verifyRest(list);
//     if (!rest) return;

//     l(await _getValidatorsNew(rest));
//   } catch (error) {}
// }

// async function main() {
//   const prefixAndRestList: [string, string, string[]][] = [
//     [
//       "osmo",
//       "test",
//       [
//         "https://osmosistest-lcd.quickapi.com/",
//         "https://lcd.osmo-test.ccvalidators.com/",
//         "https://testnet-rest.osmosis.zone/",
//       ],
//     ],
//     [
//       "juno",
//       "test",
//       [
//         "https://api.uni.junonetwork.io",
//         "https://juno-testnet-api.polkachu.com",
//         "juno-testnet-grpc.polkachu.com:12690",
//       ],
//     ],
//     [
//       "cosmos",
//       "test",
//       [
//         "https://public-cosmos-theta.w3node.com/rest/",
//         // "https://rest.sentry-01.theta-testnet.polypore.xyz",
//       ],
//     ],
//   ];

//   let res = await _verifyRestList(prefixAndRestList);
//   l(res);
// }

let chainRegistryStorage = initStorage<ChainRegistryStorage>(
  "chain-registry-storage"
);

async function main() {
  // let res = await getChainRegistry(SEED_DAPP);
  // l(res);
  l(chainRegistryStorage.get());
}

main();
