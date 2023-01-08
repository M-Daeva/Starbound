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
      const wallet = await initWalletList([chain]);

      l({
        RPC,
        wallet,
        chainId,
      });

      // add handlers
      const { sgGrantStakeAuth, sgRevokeStakeAuth } = await getSgHelpers({
        isKeplrType: true,
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
            class="flex flex-row justify-start items-center bg-black p-4 w-1/6 text-center"
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
            class="flex flex-row justify-start items-center bg-black p-4 pl-14 w-1/4 text-center"
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
            class="flex flex-row justify-start items-center bg-black p-4 pl-10 w-1/6 text-center"
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
            class="flex flex-row justify-start items-center bg-black p-4 pl-8 w-1/6 text-center"
          >
            <span class="mr-1 ml-5">VALIDATOR</span>
          </th>
          <th
            class="flex flex-row justify-start items-center bg-black p-4 pl-11 w-1/4 text-center"
          >
            <span class="mr-1">ACCESS CONTROL</span>
          </th>
        </tr>
      </thead>

      <tbody
        class="bg-grey-light flex flex-col items-center justify-start overflow-y-scroll w-full"
        style="max-height: 63vh; min-height: fit-content;"
      >
        {#each assetList as { asset, address, ratio, validator }}
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
                min="1"
                max="100"
                class="w-24 m-0 text-center ml-6"
                bind:value={ratio}
              /></td
            >

            <td class="flex justify-start items-center w-2/12">
              <select
                on:change={(e) =>
                  updateValidator(asset.symbol, e.currentTarget.value)}
                class="w-40 m-0"
              >
                {#each getValidatorListBySymbol(asset.symbol) as { operator_address, moniker }}
                  <option selected={validator === operator_address}>
                    {moniker}
                  </option>
                {/each}
              </select>
            </td>

            <td
              class="flex justify-around items-center w-2/12 bg-opacity-90 bg-slate-800"
            >
              <button
                class="btn btn-secondary m-0 w-20"
                on:click={async () => {
                  await addAuthzHandler(asset.symbol, validator);
                  await tryGrant(asset.symbol);
                }}>Grant</button
              >
              <button
                class="btn btn-warning m-0 w-20"
                on:click={async () => {
                  await addAuthzHandler(asset.symbol, validator);
                  await tryRevoke(asset.symbol);
                }}>Revoke</button
              >
            </td>

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
