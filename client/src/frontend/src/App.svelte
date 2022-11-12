<script lang="ts">
  import { Router, Link, Route } from "svelte-navigator";
  import Home from "./routes/Home.svelte";
  import Dashboard from "./routes/Dashboard.svelte";
  import Assets from "./routes/Assets.svelte";
  import Bank from "./routes/Bank.svelte";

  const paths = {
    home: "/",
    dashboard: "/dashboard",
    assets: "/assets",
    bank: "/bank",
  };
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
      <button class="btn btn-primary mt-1.5 mr-1">Connect Wallet</button>
    </header>

    <div>
      <Route primary={false} path={paths.dashboard}><Dashboard /></Route>
      <Route primary={false} path={paths.assets}><Assets /></Route>
      <Route primary={false} path={paths.bank}><Bank /></Route>
    </div>
  </div>
</Router>
