import { _verifyRpc, _verifyRpcList } from "../src/common/helpers/api-helpers";
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

async function main() {
  const a = Date.now();

  const prefixAndRpcList: [string, string, string[]][] = [
    [
      "osmo",
      "test",
      [
        "https://rpc.osmo-test.ccvalidators.com",
        "https://osmosistest-rpc.quickapi.com/",
        "https://testnet-rpc.osmosis.zone/",
      ],
    ],
    [
      "juno",
      "test",
      [
        "https://rpc.uni.junonetwork.io",
        "https://juno-testnet-rpc.polkachu.com",
      ],
    ],
    [
      "cosmos",
      "test",
      [
        "https://rpc.sentry-01.theta-testnet.polypore.xyz",
        // "https://rpc.sentry-02.theta-testnet.polypore.xyz",
      ],
    ],
  ];

  let res = await _verifyRpcList(prefixAndRpcList, SEED_DAPP);
  l(res);

  l((Date.now() - a) / 1e3);
}

main();
