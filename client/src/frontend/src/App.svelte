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
  <div class="container">
    <nav>
      <ul>
        <li class="wrapper">
          <Link class="my-link" to={paths.dashboard}>Dashboard</Link>
        </li>
        <li class="wrapper">
          <Link class="my-link" to={paths.assets}>Assets</Link>
        </li>
        <li class="wrapper">
          <Link class="my-link" to={paths.bank}>Bank</Link>
        </li>
      </ul>
    </nav>

    <div>
      <Route primary={false} path={paths.dashboard}><Dashboard /></Route>
      <Route path={paths.assets}><Assets /></Route>
      <Route path={paths.bank}><Bank /></Route>
    </div>
  </div>
</Router>

<style>
  .container {
    background-color: rgb(45, 2, 47);
    color: rgb(245, 236, 152);
  }

  nav {
    display: flex;
    justify-content: center;
  }

  ul {
    list-style-type: none;
    width: 80vw;
    display: flex;
    justify-content: space-around;
    align-items: center;
  }

  li {
    background-color: rgb(245, 236, 152);
    display: inline-block;
    padding: 5px;
    width: 100px;
    border-radius: 3px;
    text-align: center;
  }

  .wrapper :global(.my-link) {
    color: rgb(45, 2, 47);
  }

  .wrapper :global(.my-link):hover {
    text-decoration: none;
  }
</style>
