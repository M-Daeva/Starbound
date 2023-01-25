import { get } from "svelte/store";
import { l } from "../../../common/utils";
import type { DeliverTxResponse } from "@cosmjs/cosmwasm-stargate";
import type {
  AssetListItem,
  ChainResponse,
} from "../../../common/helpers/interfaces";
import {
  chainRegistryStorage,
  poolsStorage,
  txResStorage,
  isModalActiveStorage,
  CHAIN_TYPE,
  LOCAL_STORAGE_KEY,
  TARGET_HOUR,
  validatorsStorage,
  sortingConfigStorage,
} from "../services/storage";

function getAssetInfoByAddress(address: string) {
  const walletAddressPrefix = address.split("1")[0];
  const asset = get(chainRegistryStorage).find(
    ({ prefix }) => prefix === walletAddressPrefix
  );
  if (!asset) return;

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
function calcTimeDiff(targetDate: string, targetHour: number = TARGET_HOUR) {
  const targetDateWithOffset =
    new Date(targetDate).getTime() +
    (targetHour * 60 + new Date().getTimezoneOffset()) * 60 * 1e3;
  const diff = targetDateWithOffset - Date.now();
  const cnt = Math.ceil(diff / (24 * 3600 * 1e3));
  return cnt;
}

// reversed version of calcTimeDiff()
function timeDiffToDate(timeDiff: number, targetHour: number = TARGET_HOUR) {
  let date = new Date();
  date.setDate(date.getDate() + timeDiff);
  return new Date(
    date.getTime() - (date.getTimezoneOffset() + targetHour * 60) * 60 * 1e3
  )
    .toISOString()
    .split("T")[0];
}

function displayTxLink(txHash: string, chainName: string = "osmosis-testnet") {
  const baseUrl = "https://testnet.mintscan.io";
  return `${baseUrl}/${chainName}/txs/${txHash}`;
}

// calculates time difference between next distribution and current moment
function getTimeUntilRebalancing(tHour: number = TARGET_HOUR) {
  const curDate = new Date();
  const hours = curDate.getHours();
  const mins = curDate.getMinutes();

  const dMins = (60 - mins) % 60;
  const dHours = ((23 + tHour - hours) % 24) + (dMins ? 0 : 1);
  const dHoursStr = (dHours < 10 ? `0` : ``) + `${dHours}`;
  const dMinsStr = (dMins < 10 ? `0` : ``) + `${dMins}`;
  return `${dHoursStr}:${dMinsStr}`;
}

function displayModal(tx: DeliverTxResponse) {
  const status = tx.rawLog.includes("failed") ? "Err" : "Ok";
  txResStorage.set([status, tx.transactionHash]);
  isModalActiveStorage.set(true);
}

function closeModal() {
  isModalActiveStorage.set(false);
}

function displayAddress() {
  const address = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!address) {
    // displayModal("Connect wallet first!");
    return "";
  }

  const [prefix, ...[postfix]] = address.split("1");
  return `${prefix}...${postfix.slice(postfix.length - 4)}`;
}

function getValidatorListBySymbol(currentSymbol: string) {
  const fullValidatorList = get(validatorsStorage);
  const chainRegistryStorageitem = get(chainRegistryStorage).find(
    ({ symbol }) => symbol === currentSymbol
  );

  const currentChain =
    CHAIN_TYPE === "main"
      ? chainRegistryStorageitem.main
      : chainRegistryStorageitem.test;

  if (typeof currentChain === "string") return [];
  const currentChainName = currentChain.chain_name;
  // TODO: improve sorting
  return fullValidatorList
    .find(([chainName]) => chainName === currentChainName)[1]
    .sort((a, b) =>
      a.moniker.toLowerCase() > b.moniker.toLowerCase() ? 1 : -1
    );
}

function sortAssets(list: AssetListItem[]) {
  const { key, order } = get(sortingConfigStorage);
  let sign = order === "asc" ? 1 : -1;

  return list.sort((a, b) => {
    if (key === "asset") {
      return a.asset.symbol > b.asset.symbol ? sign : -sign;
    }
    return a[key] > b[key] ? sign : -sign;
  });
}

export {
  getAssetInfoByAddress,
  trimPrice,
  generateColorList,
  calcTimeDiff,
  timeDiffToDate,
  displayTxLink,
  getTimeUntilRebalancing,
  displayModal,
  closeModal,
  displayAddress,
  getValidatorListBySymbol,
  sortAssets,
};
