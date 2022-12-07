import { chainRegistryStorage, poolsStorage } from "../services/storage";
import { get } from "svelte/store";

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

// removes additional digits on display
function trimPrice(price: string) {
  // if price looks like "15000" return it unchanged
  if (!price.includes(".")) return price;

  // if price looks like "0.0000011" return it unchanged
  let [prefix, postfix]: string[] = price.split(".");
  if (prefix === "0") return price;

  // if price looks like "3.0000011" return "3.00"
  return `${prefix}.${postfix.slice(0, 2)}`;
}

// transforms (3, ["a","b"]) -> ["a","b","a"]
function generateColorList(quantity: number, baseColorList: string[]) {
  let temp: string[] = [];

  const a = Math.floor(quantity / baseColorList.length);
  const b = quantity % baseColorList.length;

  for (let i = 0; i < a; i++) {
    temp = [...temp, ...baseColorList];
  }
  return [...temp, ...baseColorList.slice(0, b)];
}

// calculates how much swaps will be provided since present time
function calcTimeDiff(targetDate: string, targetHour: number = 22) {
  const targetDateWithOffset =
    new Date(targetDate).getTime() +
    (targetHour + new Date().getTimezoneOffset() / 60) * 3600 * 1e3;
  const diff = targetDateWithOffset - Date.now();
  const cnt = Math.ceil(diff / (24 * 3600 * 1e3));
  return cnt;
}

function displayTxLink(txHash: string, chainName: string = "osmosis-testnet") {
  const baseUrl = "https://testnet.mintscan.io";
  return `${baseUrl}/${chainName}/txs/${txHash}`;
}

export {
  getAssetInfoByAddress,
  trimPrice,
  generateColorList,
  calcTimeDiff,
  displayTxLink,
};
