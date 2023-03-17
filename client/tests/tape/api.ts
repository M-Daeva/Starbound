import test from "tape";
import { initStorage } from "../../src/backend/storages";
import { readFile, access } from "fs/promises";
import { SEED_DAPP } from "../../src/common/config/testnet-config.json";
import {
  l,
  getIbcDenom,
  getChannelId,
  rootPath,
  decrypt,
} from "../../src/common/utils";
import ibcConfigAb from "../../src/common/config/ibc-config-ab.json";
import ibcConfigAc from "../../src/common/config/ibc-config-ac.json";
import {
  ChainRegistryStorage,
  IbcChannelsStorage,
  PoolsStorage,
  ValidatorsStorage,
  PoolsAndUsersStorage,
  AssetDescription,
} from "../../src/common/helpers/interfaces";
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
  getPools,
  _getChainByChainId,
} from "../../src/common/helpers/api-helpers";

let chainRegistryStorage = initStorage<ChainRegistryStorage>(
  "chain-registry-storage"
);
let ibcChannelsStorage = initStorage<IbcChannelsStorage>(
  "ibc-channels-storage"
);
let poolsStorage = initStorage<PoolsStorage>("pools-storage");
let validatorsStorage = initStorage<ValidatorsStorage>("validators-storage");

async function getSeed(): Promise<string> {
  const keyPath = rootPath("../../.test-wallets/key");

  try {
    await access(keyPath);
    const encryptionKey = await readFile(keyPath, { encoding: "utf-8" });
    const seed = decrypt(SEED_DAPP, encryptionKey);
    if (!seed) throw new Error("Can not get seed!");
    return seed;
  } catch (error) {
    l(error);
    return "";
  }
}

test("Testing API helpers", async (t) => {
  const seed = await getSeed();

  const res = await _verifyRpc(
    [
      "https://rpc.osmo-test.ccvalidators.com",
      "https://osmosistest-rpc.quickapi.com/",
      "https://testnet-rpc.osmosis.zone/",
    ],
    "osmo",
    seed
  );

  t.assert(res, "_verifyRpc");

  t.end();
});

test("Testing API helpers", async (t) => {
  const seed = await getSeed();

  const res = await getChainRegistry(seed, [], []);
  const mainnetList = res.map(({ main }) => main).filter((item) => item);
  const testnetList = res.map(({ test }) => test).filter((item) => item);
  const c1 = mainnetList.length > 50;
  const c2 = testnetList.length > 10;

  t.assert(c1 && c2, "getChainRegistry");

  t.end();
});

test("Testing API helpers", async (t) => {
  const crs = chainRegistryStorage.get();
  const ps = poolsStorage.get();

  const netsActual = (await getActiveNetworksInfo(crs, "test"))?.map(
    ({ channel_id, denom, port_id, symbol }) => ({
      channel_id,
      denom,
      port_id,
      symbol,
    })
  );

  const chainB = _getChainByChainId(crs, ibcConfigAb.b_chain_id);
  const chainC = _getChainByChainId(crs, ibcConfigAc.b_chain_id);

  const netsExpected = [
    {
      channel_id: ibcConfigAb.a_channel_id,
      denom: (
        ps?.find(([key, [v0, v1]]) => v0.symbol === chainB?.symbol) as [
          string,
          AssetDescription[]
        ]
      )[1][0].denom,
      port_id: ibcConfigAb.a_port_id,
      symbol: chainB?.symbol,
    },
    {
      channel_id: ibcConfigAc.a_channel_id,
      denom: (
        ps?.find(([key, [v0, v1]]) => v0.symbol === chainC?.symbol) as [
          string,
          AssetDescription[]
        ]
      )[1][0].denom,
      port_id: ibcConfigAc.a_port_id,
      symbol: chainC?.symbol,
    },
  ];

  t.deepEqual(netsActual, netsExpected, "getActiveNetworksInfo");

  t.end();
});
