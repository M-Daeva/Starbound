import {
  _verifyRpc,
  _verifyRpcList,
  _verifyRest,
  _verifyRestList,
  getChainRegistry,
  getUserFunds,
  getValidators,
  getChainNameAndRestList,
  filterChainRegistry,
  getIbcChannelList,
  getIbcChannnels,
  _modifyRpcList,
  _getAllGrants,
  _transformGrantList,
  updatePoolsAndUsers,
  requestRelayers,
  getActiveNetworksInfo,
  queryPools,
} from "../src/common/helpers/api-helpers";
import {
  ChainRegistryStorage,
  IbcChannelsStorage,
  PoolsStorage,
  ValidatorsStorage,
  PoolsAndUsersStorage,
} from "../src/common/helpers/interfaces";
import { initStorage } from "../src/backend/storages";
import { l, createRequest } from "../src/common/utils";
import { SEED_DAPP } from "../src/common/config/testnet-config.json";

import { DENOMS } from "../src/common/helpers/assets";

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
let ibcChannelsStorage = initStorage<IbcChannelsStorage>(
  "ibc-channels-storage"
);
let poolsStorage = initStorage<PoolsStorage>("pools-storage");
let validatorsStorage = initStorage<ValidatorsStorage>("validators-storage");

async function main() {
  // let res = await getUserFunds(
  //   chainRegistryStorage.get(),
  //   poolsAndUsersStorage.get(),
  //   "test"
  // );
  // l(res.map(({ address, holded, staked }) => ({ address, holded, staked })));

  // const res = await getValidators(
  //   getChainNameAndRestList(chainRegistryStorage.get(), "test")
  // );
  // const res2 = res.map(([k, v]) => [k, v.length]);
  // l(res2);

  // const prefixAndRestList: [string, string, string[]][] = [
  //   [
  //     "cosmos",
  //     "test",
  //     [
  //       "https://rest.sentry-01.theta-testnet.polypore.xyz",

  //       "https://rest.sentry-02.theta-testnet.polypore.xyz",

  //       "https://rest.state-sync-01.theta-testnet.polypore.xyz",

  //       "https://rest.state-sync-02.theta-testnet.polypore.xyz",

  //       "https://public-cosmos-theta.w3node.com/rest/",
  //     ],
  //   ],
  // ];
  // const t = Date.now();
  // let res = await _verifyRestList(prefixAndRestList);
  // l(res);
  // l((Date.now() - t) / 1e3);

  // const { activeNetworks, chainRegistry, ibcChannels, pools } =
  //   filterChainRegistry(
  //     chainRegistryStorage.get(),
  //     ibcChannelsStorage.get(),
  //     poolsStorage.get(),
  //     validatorsStorage.get(),
  //     "test"
  //   );

  // l({
  //   activeNetworks: activeNetworks.length,
  //   chainRegistry: chainRegistry.length,
  //   ibcChannels: ibcChannels.length,
  //   pools: pools.length,
  // });

  // let res = await getIbcChannelList(chainRegistryStorage.get(), "test");
  // l(res);

  // let baseURL = "https://rest-osmosis.ecostake.com";
  // let urlHash = "/ibc/apps/transfer/v1/denom_hashes/";
  // let req = createRequest({ baseURL });

  // l(getIbcDenom("channel-42", "ujuno"));
  // l(DENOMS.JUNO);

  // l((await getIbcChannnels(chainRegistryStorage.get(), "test"))?.length);

  // let rl: [string, string, string[]][] = [["q", "test", ["1", "2", "3"]]];
  // let al: [string, string, string[]][] = [["q", "test", ["1", "4"]]];
  // let il: [string, string, string[]][] = [["q", "test", ["2", "3", "5"]]];

  // l(_modifyRpcList(rl, al, []));
  // l(_modifyRpcList(rl, [], il));

  // let res = await _getAllGrants(
  //   "osmo18tnvnwkklyv4dyuj8x357n7vray4v4zupj6xjt",
  //   chainRegistryStorage.get(),
  //   "test"
  // );

  // if (!res) return;

  // for (let item of res) {
  //   l(item);
  // }

  // l(
  //   _transformGrantList([
  //     ["juno", [["juno_addr_1", "juno_val_1"]]],
  //     [
  //       "osmo",
  //       [
  //         ["osmo_addr_1", "osmo_val_1"],
  //         ["osmo_addr_2", "osmo_val_2"],
  //         ["osmo_addr_3", "osmo_val_3"],
  //       ],
  //     ],
  //     [
  //       "atom",
  //       [
  //         ["atom_addr_1", "atom_val_1"],
  //         ["atom_addr_2", "atom_val_2"],
  //       ],
  //     ],
  //   ])
  // );

  // l(await getIbcChannnels(chainRegistryStorage.get(), "test"));

  // let res = await requestRelayers(chainRegistryStorage.get(), "test");
  // l(res);

  // TODO: test on mainnet
  // let res = await getActiveNetworksInfo(chainRegistryStorage.get(), "test");
  // l(res);

  // const poolsAndUsers: PoolsAndUsersStorage = { pools: [], users: [] };
  // const res = await updatePoolsAndUsers(
  //   chainRegistryStorage.get(),
  //   poolsAndUsers,
  //   "test"
  // );
  // l(res);

  // let grants = await _getAllGrants(
  //   "osmo18tnvnwkklyv4dyuj8x357n7vray4v4zupj6xjt",
  //   chainRegistryStorage.get(),
  //   "test"
  // );
  // if (!grants) return;

  // for (const grant of grants) {
  //   l(grant);
  // }

  // let res = await queryPools(chainRegistryStorage.get());
  // l(res);

  const { activeNetworks, chainRegistry, ibcChannels, pools } =
    filterChainRegistry(
      chainRegistryStorage.get(),
      ibcChannelsStorage.get(),
      poolsStorage.get(),
      validatorsStorage.get(),
      "test"
    );

  l(activeNetworks);
  l(pools);
}

main();
