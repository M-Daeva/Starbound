<script lang="ts">
  import { DENOMS } from "../../../common/helpers/assets";
  import type { AssetListItem } from "../../../common/helpers/interfaces";
  import { l, createRequest } from "../../../common/utils";
  import { getAddrByPrefix } from "../../../common/signers";
  import {
    chainRegistryStorage,
    ibcChannellsStorage,
    poolsStorage,
    userFundsStorage,
    validatorsStorage,
    assetListStorage,
    getRegistryChannelsPools,
    getValidators,
  } from "../services/storage";
  import { get } from "svelte/store";
  import { onMount } from "svelte";
  import { Description } from "cosmjs-types/cosmos/staking/v1beta1/staking";

  let assetList: AssetListItem[] = [];
  let ratio: number = 1;
  let denoms: string[] = [];
  let currentSymbol = "";
  let sortingConfig: {
    key: keyof AssetListItem;
    order: "asc" | "desc";
  } = { key: "address", order: "asc" };

  assetListStorage.subscribe((value) => {
    assetList = value;
  });

  chainRegistryStorage.subscribe((value) => {
    denoms = value.map((item) => item.symbol);
  });

  // TODO: use monikers to sort validators
  function sortAssets(list: AssetListItem[]) {
    let sign = sortingConfig.order === "asc" ? 1 : -1;
    let { key } = sortingConfig;

    return list.sort((a, b) => {
      if (key === "asset") {
        return a.asset.symbol > b.asset.symbol ? sign : -sign;
      }
      return a[key] > b[key] ? sign : -sign;
    });
  }

  function sortAndUpdateAssets(key: keyof AssetListItem) {
    sortingConfig = {
      key,
      order: sortingConfig.order === "asc" ? "desc" : "asc",
    };

    assetListStorage.update((list) => sortAssets(list));
  }

  function removeAsset(address: string) {
    assetListStorage.update((items) =>
      items.filter((row) => row.address !== address)
    );
  }

  function addAsset(currentSymbol: string) {
    let registryItem = get(chainRegistryStorage).find(
      ({ symbol }) => symbol === currentSymbol
    );
    // TODO: get address from wallet
    let currentAsset: AssetListItem = {
      address: getAddrByPrefix(
        "osmo1gjqnuhv52pd2a7ets2vhw9w9qa9knyhy7y9tgx",
        registryItem.prefix
      ),
      asset: { symbol: registryItem.symbol, logo: registryItem.img },
      isGranted: false,
      ratio,
      validator: getValidatorListBySymbol(currentSymbol)[0].operator_address,
    };

    assetListStorage.update((rows) =>
      sortAssets([
        ...rows.filter((row) => row.asset.symbol !== currentSymbol),
        currentAsset,
      ])
    );
  }

  function updateValidator(currentSymbol: string, currentMoniker: string) {
    currentMoniker = currentMoniker.trim();
    let validatorList = getValidatorListBySymbol(currentSymbol);
    let currentValidator = validatorList.find(
      ({ description: { moniker } }) => moniker === currentMoniker
    );

    assetListStorage.update((rows) =>
      rows.map((row) => {
        if (row.asset.symbol === currentSymbol) {
          return { ...row, validator: currentValidator.operator_address };
        }
        return row;
      })
    );
  }

  function getValidatorListBySymbol(currentSymbol: string) {
    let fullValidatorList = get(validatorsStorage);
    let currentChain = get(chainRegistryStorage).find(
      ({ symbol }) => symbol === currentSymbol
    ).main;

    if (typeof currentChain === "string") return [];
    let currentChainName = currentChain.chain_name;

    // TODO: improve sorting
    return fullValidatorList
      .find(([chainName]) => chainName === currentChainName)[1]
      .sort((a, b) =>
        a.description.moniker.toLowerCase() >
        b.description.moniker.toLowerCase()
          ? 1
          : -1
      );
  }

  // TODO: add handler on grant button

  onMount(async () => {
    try {
      validatorsStorage.set(await getValidators());
    } catch (error) {}
  });
</script>

<div class="flex flex-col px-4 -mt-3" style="height: 87vh">
  <div
    class="container flex justify-around items-center py-2 pr-28 text-amber-200 font-medium my-2"
    style="background-color: rgb(42 48 60);"
  >
    <div class="flex flex-row justify-center items-center w-4/12">
      <label for="symbol-selector" class="mr-3">Select Asset</label>
      <select id="symbol-selector" class="w-28 m-0" bind:value={currentSymbol}>
        {#each denoms as denom}
          <option value={denom}>
            {denom}
          </option>
        {/each}
      </select>
    </div>
    <div class="flex flex-row justify-center items-center w-4/12">
      <label for="weight-selector" class="mr-3">Specify Weight in %</label>
      <input
        id="weight-selector"
        type="number"
        min="1"
        max="100"
        class="w-24 m-0 text-center"
        bind:value={ratio}
      />
    </div>
    <div class="flex justify-end w-3/12 pr-1">
      <button
        class="btn btn-secondary m-0 w-28"
        on:click={() => addAsset(currentSymbol)}>Add Asset</button
      >
    </div>
  </div>

  <div class="w-full overflow-x-auto mt-1">
    <table class="table table-compact w-full">
      <thead class="bg-black flex text-white w-full pr-4">
        <tr class="flex w-full mb-1">
          <th
            class="flex flex-row justify-start items-center bg-black p-4 w-1/4 text-center"
          >
            <span class="mr-1 ml-5">ASSET</span>
            <button
              on:click={() => sortAndUpdateAssets("asset")}
              class="bg-transparent outline-none border-none my-auto"
            >
              <img
                class="hover:cursor-pointer"
                src="src/public/up-down-arrow.svg"
                alt="arrow"
              />
            </button>
          </th>
          <th
            class="flex flex-row justify-start items-center bg-black p-4 w-1/4 text-center"
          >
            <span class="mr-1 ml-5">ADDRESS</span>
            <button
              on:click={() => sortAndUpdateAssets("address")}
              class="bg-transparent outline-none border-none my-auto"
            >
              <img
                class="hover:cursor-pointer"
                src="src/public/up-down-arrow.svg"
                alt="arrow"
              />
            </button>
          </th>
          <th
            class="flex flex-row justify-start items-center bg-black p-4 w-1/4 text-center"
          >
            <span class="mr-1 ml-12">WEIGHT in %</span>
            <button
              on:click={() => sortAndUpdateAssets("ratio")}
              class="bg-transparent outline-none border-none my-auto"
            >
              <img
                class="hover:cursor-pointer"
                src="src/public/up-down-arrow.svg"
                alt="arrow"
              />
            </button>
          </th>
          <th
            class="flex flex-row justify-start items-center bg-black p-4 w-1/4 text-center"
          >
            <span class="mr-1 ml-5">VALIDATOR</span>
            <button
              on:click={() => sortAndUpdateAssets("validator")}
              class="bg-transparent outline-none border-none my-auto"
            >
              <img
                class="hover:cursor-pointer"
                src="src/public/up-down-arrow.svg"
                alt="arrow"
              />
            </button>
          </th>
          <th
            class="flex flex-row justify-start items-center bg-black p-4 w-1/4 text-center"
          >
            <span class="mr-1">GRANT STATUS</span>
            <button
              on:click={() => sortAndUpdateAssets("isGranted")}
              class="bg-transparent outline-none border-none my-auto"
            >
              <img
                class="hover:cursor-pointer"
                src="src/public/up-down-arrow.svg"
                alt="arrow"
              />
            </button>
          </th>
        </tr>
      </thead>

      <tbody
        class="bg-grey-light flex flex-col items-center justify-start overflow-y-scroll w-full"
        style="max-height: 63vh; min-height: fit-content;"
      >
        {#each assetList as { asset, address, ratio, validator, isGranted }}
          <tr class="flex justify-start items-stretch w-full mt-4 first:mt-0">
            <td class="flex flex-row justify-start items-center w-2/12 pl-5">
              <img class="w-2/12" src={asset.logo} alt="logo" />
              <span class="ml-1">{asset.symbol}</span></td
            >
            <td class="flex justify-center items-center w-4/12 p-0 -ml-20"
              ><input
                type="text"
                class="m-0 text-center"
                style="width: 90%;"
                bind:value={address}
              /></td
            >
            <td class="flex justify-start items-center w-2/12"
              ><input
                type="number"
                min="0"
                max="100"
                class="w-24 m-0 text-center ml-6"
                bind:value={ratio}
              /></td
            >

            <td class="flex justify-start items-center w-3/12">
              <select
                on:change={(e) =>
                  updateValidator(asset.symbol, e.currentTarget.value)}
                class="w-40 m-0"
              >
                {#each getValidatorListBySymbol(asset.symbol) as { operator_address, description: { moniker } }}
                  <option selected={validator === operator_address}>
                    {moniker}
                  </option>
                {/each}
              </select>
            </td>

            <td class="flex justify-center items-center w-1/12"
              ><button class="btn btn-secondary m-0 w-28 -ml-10"
                >{isGranted ? "Revoke" : "Grant"}</button
              ></td
            >
            <td class="flex justify-center items-center w-1/12"
              ><button
                class="btn btn-circle m-0"
                on:click={() => removeAsset(address)}>❌</button
              ></td
            >
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
