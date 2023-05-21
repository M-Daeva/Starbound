import test from "tape";
import { Storage } from "../../src/backend/storages";
import ibcConfigAb from "../../src/common/config/ibc-config-ab.json";
import ibcConfigAc from "../../src/common/config/ibc-config-ac.json";
import {
  ChainRegistryStorage,
  IbcChannelsStorage,
  PoolsStorage,
  ValidatorsStorage,
  PoolsAndUsersStorage,
  AssetDescription,
} from "../../src/common/interfaces";
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
} from "../../src/backend/helpers";

const chainRegistryStorage = new Storage<ChainRegistryStorage>(
  "chain-registry-storage"
);
const ibcChannelsStorage = new Storage<IbcChannelsStorage>(
  "ibc-channels-storage"
);
const poolsStorage = new Storage<PoolsStorage>("pools-storage");
const validatorsStorage = new Storage<ValidatorsStorage>("validators-storage");

test("Testing API helpers", async (t) => {
  const res = await _verifyRpc(
    [
      "https://rpc.osmo-test.ccvalidators.com",
      "https://osmosistest-rpc.quickapi.com/",
      "https://testnet-rpc.osmosis.zone/",
    ],
    "osmo"
  );

  t.assert(res, "_verifyRpc");

  t.end();
});

test("Testing API helpers", async (t) => {
  const res = await getChainRegistry([], []);
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
