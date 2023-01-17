<script lang="ts">
  import { Router, Link, Route } from "svelte-navigator";
  import Dashboard from "./routes/Dashboard.svelte";
  import Assets from "./routes/Assets.svelte";
  import Bank from "./routes/Bank.svelte";
  import { init } from "./services/wallet";
  import Modal from "./components/Modal.svelte";
  import { displayAddress } from "./services/helpers";
  import { get } from "svelte/store";
  import {
    isModalActiveStorage,
    initAll,
    CHAIN_TYPE,
    chainRegistryStorage,
  } from "./services/storage";

  const paths = {
    home: "/",
    dashboard: "/dashboard",
    assets: "/assets",
    bank: "/bank",
  };

  let checked = false;

  let isModalActive = false;

  function removeOverlay() {
    setTimeout(() => {
      checked = false;
    }, 0);
  }

  isModalActiveStorage.subscribe((value) => {
    isModalActive = value;
  });

  // init storages
  initAll();
</script>

<Router>
  <div class="bg-indigo-900 text-amber-200">
    <header
      class="flex justify-between items-center px-3 mb-5 border-white border-b-2"
    >
      <div
        class="hidden sm:flex justify-center align-middle items-center w-3/12 -mt-2"
      >
        <!-- <img class="w-1/12" src="src/public/s.png" alt="logo" /> -->
        <h1 class="font-medium md:font-bold text-2xl md:text-3xl -ml-2 -mb-1">
          Starbound
        </h1>
      </div>
      <!-- hamburger -->
      <div
        class={"flex sm:hidden items-center w-16 h-16 z-50 sm:static " +
          (checked ? "fixed" : "justify-center")}
      >
        <label class="flex flex-col cursor-pointer">
          <input
            type="checkbox"
            id="check"
            class="hidden"
            on:click={() => (checked = !checked)}
          />

          <span
            class={"bg-amber-200 rounded-md h-1 w-10 mb-2 " +
              (checked
                ? "transform -rotate-45 origin-center translate-y-1.5"
                : "")}
          />
          <span
            class={"bg-amber-200 rounded-md h-1 w-10 mb-2 " +
              (checked ? "hidden" : "")}
          />
          <span
            class={"bg-amber-200 rounded-md h-1 w-10 " +
              (checked
                ? "transform rotate-45 origin-center -translate-y-1.5"
                : "")}
          />
        </label>
      </div>
      <!-- navbar -->
      <nav
        class={"font-normal md:font-medium text-xl " +
          (checked
            ? "fixed z-40 w-full h-full bg-indigo-900 text-center top-0 left-0"
            : "hidden sm:block sm:w-6/12")}
      >
        <ul class={"my-5 flex justify-around " + (checked ? "flex-col" : "")}>
          <li on:mousedown={removeOverlay} class={checked ? "mb-14" : ""}>
            <Link
              class="text-center hover:no-underline visited:text-amber-200"
              to={paths.bank}>Bank</Link
            >
          </li>
          <li on:mousedown={removeOverlay} class={checked ? "mb-14" : ""}>
            <Link
              class="text-center hover:no-underline visited:text-amber-200"
              to={paths.assets}>Assets</Link
            >
          </li>
          <li on:mousedown={removeOverlay}>
            <Link
              class="text-center hover:no-underline visited:text-amber-200"
              to={paths.dashboard}>Dashboard</Link
            >
          </li>
        </ul>
      </nav>
      <div class="w-36 flex flex-row">
        <img class="w-5 mr-1" src="src/public/wallet.png" alt="wallet" />
        <div class="font-normal">{displayAddress()}</div>
      </div>
      <button
        class="btn btn-primary mt-1.5 mr-1 w-32"
        on:click={async () => {
          const { initCwHandler } = await init(
            get(chainRegistryStorage),
            CHAIN_TYPE
          );
          initCwHandler();
        }}>Connect Wallet</button
      >
    </header>

    <div>
      <Route primary={false} path={paths.bank}><Bank /></Route>
      <Route primary={false} path={paths.assets}><Assets /></Route>
      <Route primary={false} path={paths.dashboard}><Dashboard /></Route>
    </div>

    {#if isModalActive}
      <Modal />
    {/if}
  </div>
</Router>
