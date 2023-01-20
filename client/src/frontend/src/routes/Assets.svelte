<script lang="ts">
  import { l } from "../../../common/utils";
  import { get } from "svelte/store";
  import { getAddrByPrefix, initWalletList } from "../../../common/signers";
  import { getSgHelpers } from "../../../common/helpers/sg-helpers";
  import type {
    AssetListItem,
    DelegationStruct,
  } from "../../../common/helpers/interfaces";
  import {
    displayModal,
    getValidatorListBySymbol,
    sortAssets,
  } from "../services/helpers";
  import {
    chainRegistryStorage,
    assetListStorage,
    authzHandlerListStorage,
    sortingConfigStorage,
    addressStorage,
    DAPP_ADDR,
    CHAIN_TYPE,
  } from "../services/storage";

  let assetList: AssetListItem[] = [];
  let ratio: number = 1;
  let denoms: string[] = [];
  let currentSymbol = "";

  assetListStorage.subscribe((value) => {
    assetList = value;
  });

  chainRegistryStorage.subscribe((value) => {
    denoms = value.map((item) => item.symbol);
  });

  // TODO: try to find better RPC provider
  async function addAuthzHandler(currentSymbol: string, validator: string) {
    let authzHandlerList = get(authzHandlerListStorage);
    const chain = get(chainRegistryStorage).find(
      ({ symbol }) => symbol === currentSymbol
    );

    let RPC: string | undefined;
    let chainId: string | undefined;

    if (CHAIN_TYPE === "main" && chain?.main) {
      RPC = chain.main.apis.rpc?.[0]?.address;
      chainId = chain.main.chain_id;
    }
    if (CHAIN_TYPE === "test" && chain?.test) {
      RPC = chain.test.apis.rpc?.[0]?.address;
      chainId = chain.test.chain_id;
    }

    try {
      const wallet = await initWalletList([chain], CHAIN_TYPE);

      l({
        RPC,
        wallet,
        chainId,
      });

      // add handlers
      const { sgGrantStakeAuth, sgRevokeStakeAuth } = await getSgHelpers({
        RPC,
        wallet,
        chainId,
      });
      const delegationStruct: DelegationStruct = {
        tokenAmount: 1e15,
        tokenDenom: chain.denomNative,
        targetAddr: getAddrByPrefix(DAPP_ADDR, chain.prefix),
        validatorAddr: validator,
      };

      authzHandlerList = [
        ...authzHandlerList.filter(({ symbol }) => symbol !== currentSymbol),
        {
          symbol: currentSymbol,
          grant: async () => await sgGrantStakeAuth(delegationStruct),
          revoke: async () => await sgRevokeStakeAuth(delegationStruct),
        },
      ];
      authzHandlerListStorage.set(authzHandlerList);
      l(get(authzHandlerListStorage));
    } catch (error) {
      l({ error });
    }
  }

  async function tryGrant(currentSymbol: string) {
    try {
      const { grant } = get(authzHandlerListStorage).find(
        ({ symbol }) => symbol === currentSymbol
      );
      let tx = await grant();
      l({ tx });
      displayModal(tx.transactionHash);
    } catch (error) {
      l({ error });
    }
  }

  async function tryRevoke(currentSymbol: string) {
    try {
      const { revoke } = get(authzHandlerListStorage).find(
        ({ symbol }) => symbol === currentSymbol
      );
      let tx = await revoke();
      l({ tx });
      displayModal(tx.transactionHash);
    } catch (error) {
      l({ error });
    }
  }

  function sortAndUpdateAssets(key: keyof AssetListItem) {
    sortingConfigStorage.update(({ order }) => {
      return {
        key,
        order: order === "asc" ? "desc" : "asc",
      };
    });

    assetListStorage.update((list) => sortAssets(list));
  }

  function removeAsset(address: string) {
    assetListStorage.update((items) =>
      items.filter((row) => row.address !== address)
    );
  }

  function addAsset(currentSymbol: string) {
    const registryItem = get(chainRegistryStorage).find(
      ({ symbol }) => symbol === currentSymbol
    );
    if (!registryItem) return;

    const { prefix, symbol, img } = registryItem;
    const currentAsset: AssetListItem = {
      address: getAddrByPrefix(get(addressStorage), prefix),
      asset: { symbol, logo: img },
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
      ({ moniker }) => moniker.trim() === currentMoniker
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
</script>

<div class="flex flex-col px-4 -mt-3 pb-4">
  <div
    class="flex flex-col sm:flex-row justify-around items-center py-5 sm:py-2 text-amber-200 font-medium my-2"
    style="background-color: rgb(42 48 60);"
  >
    <div
      class="flex flex-row justify-between sm:justify-center items-center w-64 sm:w-52 mb-5 sm:mb-0"
    >
      <label for="symbol-selector" class="mr-2">Select Asset</label>
      <select id="symbol-selector" class="w-28 m-0" bind:value={currentSymbol}>
        {#each denoms as denom}
          <option value={denom}>
            {denom}
          </option>
        {/each}
      </select>
    </div>
    <div
      class="flex flex-row justify-between sm:justify-center items-center w-64 mb-5 sm:mb-0"
    >
      <label for="weight-selector" class="mr-2">Specify Weight in %</label>
      <input
        id="weight-selector"
        type="number"
        min="1"
        max="100"
        class="w-24 m-0 text-center"
        bind:value={ratio}
      />
    </div>
    <div class="flex justify-center pr-1">
      <button
        class="btn btn-secondary m-0 w-28"
        on:click={() => addAsset(currentSymbol)}>Add Asset</button
      >
    </div>
  </div>

  <div class="w-full overflow-x-auto mt-1">
    <table class="table table-compact w-full overflow-x-scroll">
      <thead class="bg-black flex text-white w-full">
        <tr class="flex w-full mb-1 justify-around">
          <th
            class="flex flex-row justify-center items-center bg-black w-[116px] text-center"
          >
            <span class="mr-1">ASSET</span>
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
            class="flex flex-row justify-center items-center bg-black w-[370px] text-center"
          >
            <span class="mr-1">ADDRESS</span>
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
            class="flex flex-row justify-center items-center bg-black w-36 text-center"
          >
            <span class="mr-1">WEIGHT in %</span>
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
            class="flex flex-row justify-center items-center bg-black w-36 text-center"
          >
            <span>VALIDATOR</span>
          </th>
          <th
            class="flex flex-row justify-center items-center bg-black w-44 text-center"
          >
            <span>ACCESS CONTROL</span>
          </th>
          <th class="w-12 bg-black"><div /></th>
        </tr>
      </thead>

      <tbody
        class="bg-grey-light flex flex-col items-center justify-start overflow-y-scroll w-full"
        style="max-height: 63vh; min-height: fit-content;"
      >
        {#each assetList as { asset, address, ratio, validator }}
          <tr
            class="flex justify-around w-full mt-4 first:mt-0"
            style="background-color: rgb(42 48 60);"
          >
            <td class="flex flex-row justify-start items-center w-[116px]">
              <img class="w-7" src={asset.logo} alt="logo" />
              <span class="ml-1">{asset.symbol}</span></td
            >
            <td class="flex justify-center items-center w-[370px]"
              ><input
                type="text"
                class="m-0 text-center w-full"
                bind:value={address}
              /></td
            >
            <td class="flex justify-center items-center w-36"
              ><input
                type="number"
                min="1"
                max="100"
                class="w-full m-0 text-center"
                bind:value={ratio}
              /></td
            >

            <td class="flex justify-center items-center w-36">
              <select
                on:change={(e) =>
                  updateValidator(asset.symbol, e.currentTarget.value)}
                class="w-full m-0"
              >
                {#each getValidatorListBySymbol(asset.symbol) as { operator_address, moniker }}
                  <option selected={validator === operator_address}>
                    {moniker}
                  </option>
                {/each}
              </select>
            </td>

            <td
              class="flex justify-around items-center w-44 bg-opacity-90 bg-slate-800"
            >
              <button
                class="btn btn-secondary m-0 w-5/12"
                on:click={async () => {
                  await addAuthzHandler(asset.symbol, validator);
                  await tryGrant(asset.symbol);
                }}>Grant</button
              >
              <button
                class="btn btn-warning m-0 w-5/12"
                on:click={async () => {
                  await addAuthzHandler(asset.symbol, validator);
                  await tryRevoke(asset.symbol);
                }}>Revoke</button
              >
            </td>

            <td class="flex justify-center items-center w-12"
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
