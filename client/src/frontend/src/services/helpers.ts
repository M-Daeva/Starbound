import {
  chainRegistryStorage,
  userFundsStorage,
  poolsStorage,
  getUserFunds,
  getPools,
} from "../services/storage";
import { get } from "svelte/store";
import { l } from "../../../common/utils";

function getAssetInfoByAddress(address: string) {
  const walletAddressPrefix = address.split("1")[0];
  const asset = get(chainRegistryStorage).find(
    ({ prefix }) => prefix === walletAddressPrefix
  );

  const pool = get(poolsStorage).find(
    ([k, [v0, v1]]) => v0.symbol === asset.symbol
  ) || ["", [{ price: "0" }]];

  return { asset, price: pool[1][0].price.toString() };
}

export { getAssetInfoByAddress };
