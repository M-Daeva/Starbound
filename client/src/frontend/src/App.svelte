<script lang="ts">
  import { Router, Link, Route } from "svelte-navigator";
  import Dashboard from "./routes/Dashboard.svelte";
  import Assets from "./routes/Assets.svelte";
  import Bank from "./routes/Bank.svelte";
  import type { Coin } from "@cosmjs/stargate";
  import { DENOMS } from "../../common/helpers/assets";
  import { getAddrByPrefix, initWalletList } from "../../common/signers";
  import type {
    NetworkData,
    ChainResponse,
    AssetListItem,
    IbcResponse,
    AssetDescription,
    ValidatorResponse,
  } from "../../common/helpers/interfaces";
  import { l, createRequest } from "../../common/utils";
  import { baseURL } from "./config";
  import { onMount } from "svelte";
  import {
    chainRegistryStorage,
    ibcChannellsStorage,
    poolsStorage,
    userFundsStorage,
    validatorsStorage,
    cwHandlerStorage,
    getRegistryChannelsPools,
    getValidators,
    getUserFunds,
  } from "./services/storage";
  import { get } from "svelte/store";

  const paths = {
    home: "/",
    dashboard: "/dashboard",
    assets: "/assets",
    bank: "/bank",
  };

  const localSorageKey = "starbound-osmo-address";

  let chainRegistry: NetworkData[] = [];

  // init wallet, add osmo chain, save address to localSorage
  async function initCwHandler() {
    const CONTRACT_ADDR = "";
    const chainType: "main" | "test" = "test";

    const chain = get(chainRegistryStorage).find(
      ({ symbol }) => symbol === "OSMO"
    );

    if (typeof chain[chainType] === "string") return;

    try {
      const RPC = chain[chainType].apis.rpc[0].address;
      const chainId = chain[chainType].chain_id;
      const wallet = await initWalletList([chain]);
      let address = (await wallet.getKey(chain[chainType].chain_id))
        .bech32Address;
      cwHandlerStorage.set({ address });

      // TODO: encode address
      localStorage.setItem(localSorageKey, address);
    } catch (error) {
      l({ error });
    }

    l(get(cwHandlerStorage));
  }

  onMount(async () => {
    try {
      chainRegistryStorage.set(
        (await getRegistryChannelsPools()).chainRegistry
      );
      chainRegistry = get(chainRegistryStorage);

      const address = localStorage.getItem(localSorageKey) || "";
      if (address === "") throw new Error("Connect wallet first");
      cwHandlerStorage.set({ address });
    } catch (error) {
      l(error);
    }
  });
</script>

<Router>
  <div class="bg-indigo-900 text-amber-200">
    <header
      class="flex justify-between items-center px-3 mb-5 border-white border-b-2"
    >
      <div class="flex justify-center align-middle items-center w-4/12 -mt-2">
        <img class="w-1/12" src="src/public/s.png" alt="logo" />
        <h1 class="font-bold text-3xl -ml-2 -mb-1">tarbound</h1>
      </div>
      <nav class="w-6/12 font-medium text-xl">
        <ul class="my-5 flex justify-around">
          <li>
            <Link
              class="text-center hover:no-underline visited:text-amber-200"
              to={paths.dashboard}>Dashboard</Link
            >
          </li>
          <li>
            <Link
              class="text-center hover:no-underline visited:text-amber-200"
              to={paths.assets}>Assets</Link
            >
          </li>
          <li>
            <Link
              class="text-center hover:no-underline visited:text-amber-200"
              to={paths.bank}>Bank</Link
            >
          </li>
        </ul>
      </nav>
      <button class="btn btn-primary mt-1.5 mr-1" on:click={initCwHandler}
        >Connect Wallet</button
      >
    </header>

    <div>
      <Route primary={false} path={paths.dashboard}><Dashboard /></Route>
      <Route primary={false} path={paths.assets}><Assets /></Route>
      <Route primary={false} path={paths.bank}><Bank /></Route>
    </div>
  </div>
</Router>
