import test from "tape";
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
import {
  ChainRegistryStorage,
  IbcChannelsStorage,
  PoolsStorage,
  ValidatorsStorage,
  PoolsAndUsersStorage,
  AssetDescription,
} from "../../src/common/helpers/interfaces";
import { initStorage } from "../../src/backend/storages";
import { l, getIbcDenom, getChannelId } from "../../src/common/utils";
import ibcConfigAb from "../../../ibc-config-ab.json";
import ibcConfigAc from "../../../ibc-config-ac.json";

let chainRegistryStorage = initStorage<ChainRegistryStorage>(
  "chain-registry-storage"
);
let ibcChannelsStorage = initStorage<IbcChannelsStorage>(
  "ibc-channels-storage"
);
let poolsStorage = initStorage<PoolsStorage>("pools-storage");
let validatorsStorage = initStorage<ValidatorsStorage>("validators-storage");

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
      denom: getIbcDenom(
        ibcConfigAb.a_channel_id,
        `${ibcConfigAb.a_port_id}/${getChannelId(
          chainB?.denomNative as string,
          (
            ps?.find(([key, [v0, v1]]) => v0.symbol === chainB?.symbol) as [
              string,
              AssetDescription[]
            ]
          )[1][0].denom,
          ibcConfigAb.a_port_id
        )}/${chainB?.denomNative as string}`,
        ibcConfigAb.a_port_id
      ),
      port_id: ibcConfigAb.a_port_id,
      symbol: chainB?.symbol,
    },
    {
      channel_id: ibcConfigAc.a_channel_id,
      denom: getIbcDenom(
        ibcConfigAc.a_channel_id,
        `${ibcConfigAc.a_port_id}/${getChannelId(
          chainC?.denomNative as string,
          (
            ps?.find(([key, [v0, v1]]) => v0.symbol === chainC?.symbol) as [
              string,
              AssetDescription[]
            ]
          )[1][0].denom,
          ibcConfigAc.a_port_id
        )}/${chainC?.denomNative as string}`,
        ibcConfigAc.a_port_id
      ),
      port_id: ibcConfigAc.a_port_id,
      symbol: chainC?.symbol,
    },
  ];

  t.deepEqual(netsActual, netsExpected, "getActiveNetworksInfo");

  t.end();
});