<script lang="ts">
  import { DENOMS } from "../../../common/helpers/assets";
  import type { AssetListItem } from "../../../common/helpers/interfaces";
  import { l, createRequest } from "../../../common/utils";

  export let rows: AssetListItem[] = [];

  let denoms = Object.keys(DENOMS);
  let currentSymbol = "";

  function removeAsset(address: string) {
    rows = rows.filter((row) => row.address !== address);
  }

  function addAsset(currentSymbol: string) {
    let { address, asset } = rows.find(
      ({ asset: { symbol } }) => symbol === currentSymbol
    );

    let currentAsset: AssetListItem = {
      address,
      asset,
      isGranted: false,
      ratio: "20",
      validator: "Imperator",
    };
    rows = [...rows, currentAsset];
  }
</script>

<div class="flex flex-col px-4 -mt-3" style="height: 87vh">
  <div
    class="container flex justify-around items-center py-2 pr-28 text-amber-200 font-medium my-2"
    style="background-color: rgb(42 48 60);"
  >
    <div class="flex flex-row justify-center items-center w-4/12">
      <label for="sybol-selector" class="mr-3">Select Asset</label>
      <select id="sybol-selector" class="w-28 m-0" bind:value={currentSymbol}>
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
            <img
              class="hover:cursor-pointer"
              src="src/public/up-down-arrow.svg"
              alt="arrow"
            />
          </th>
          <th
            class="flex flex-row justify-start items-center bg-black p-4 w-1/4 text-center"
          >
            <span class="mr-1 ml-5">ADDRESS</span>
            <img
              class="hover:cursor-pointer"
              src="src/public/up-down-arrow.svg"
              alt="arrow"
            />
          </th>
          <th
            class="flex flex-row justify-start items-center bg-black p-4 w-1/4 text-center"
          >
            <span class="mr-1 ml-12">WEIGHT in %</span>
            <img
              class="hover:cursor-pointer"
              src="src/public/up-down-arrow.svg"
              alt="arrow"
            />
          </th>
          <th
            class="flex flex-row justify-start items-center bg-black p-4 w-1/4 text-center"
          >
            <span class="mr-1 ml-5">VALIDATOR</span>
            <img
              class="hover:cursor-pointer"
              src="src/public/up-down-arrow.svg"
              alt="arrow"
            />
          </th>
          <th
            class="flex flex-row justify-start items-center bg-black p-4 w-1/4 text-center"
          >
            <span class="mr-1">GRANT STATUS</span>
            <img
              class="hover:cursor-pointer"
              src="src/public/up-down-arrow.svg"
              alt="arrow"
            />
          </th>
        </tr>
      </thead>

      <tbody
        class="bg-grey-light flex flex-col items-center justify-start overflow-y-scroll w-full"
        style="max-height: 63vh; min-height: fit-content;"
      >
        {#each rows as { asset, address, ratio, validator, isGranted }}
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
                value={address}
              /></td
            >
            <td class="flex justify-start items-center w-2/12"
              ><input
                type="number"
                min="0"
                max="100"
                class="w-24 m-0 text-center ml-6"
                value={ratio}
              /></td
            >
            <td class="flex justify-start items-center w-3/12 pl-14"
              >{validator}</td
            >
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
