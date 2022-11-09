<script lang="ts">
  import { onMount } from "svelte";
  import type { ChartData } from "chart.js";
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    CategoryScale,
  } from "chart.js";
  import { Doughnut } from "svelte-chartjs";
  import Decimal from "decimal.js";

  const data = {
    labels: [
      "Atom",
      "Osmo",
      "Juno",
      "Atom",
      "Osmo",
      "Juno",
      "Atom",
      "Osmo",
      "Juno",
    ],
    datasets: [
      {
        data: [300, 50, 100, 300, 50, 100, 300, 50, 100],
        backgroundColor: [
          "#F7464A",
          "#46BFBD",
          "#FDB45C",
          "#F7464A",
          "#46BFBD",
          "#FDB45C",
          "#F7464A",
          "#46BFBD",
          "#FDB45C",
        ],
        hoverBackgroundColor: [
          "#FF5A5E",
          "#5AD3D1",
          "#FFC870",
          "#FF5A5E",
          "#5AD3D1",
          "#FFC870",
          "#FF5A5E",
          "#5AD3D1",
          "#FFC870",
        ],
      },
    ],
  };

  ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);

  interface Row {
    asset: string;
    price: Decimal;
    holded: Decimal;
    staked: Decimal;
    cost: number;
    allocation: Decimal;
  }

  let row: Row = {
    asset: "ATOM",
    price: new Decimal("12"),
    holded: new Decimal("10.5"),
    staked: new Decimal("30.1"),
    cost: 500,
    allocation: new Decimal("19.2"),
  };

  let rows: Row[] = [...new Array(35)].map((_) => row);
</script>

<div class="container">
  <div class="chart-container">
    <h3>Deposited on current period: {1000}</h3>
    <h3>Deposited on next period: {1000}</h3>
    <h3>Portfolio networth: {1000}</h3>
    <Doughnut
      class="canvas"
      {data}
      options={{ responsive: true, radius: "90%" }}
    />
  </div>

  <div class="table-container">
    <div class="overflow-x-auto">
      <table class="table table-compact w-full">
        <thead>
          <tr>
            {#each Object.keys(row).map((item) => item[0].toUpperCase() + item.slice(1)) as key}
              <th>{key}</th>
            {/each}
          </tr>
        </thead>

        <tbody>
          {#each rows as { asset, price, holded, staked, cost, allocation }}
            <tr>
              <td>{asset}</td>
              <td>{price}</td>
              <td>{holded}</td>
              <td>{staked}</td>
              <td>{cost}</td>
              <td>{allocation}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<style>
  .container {
    display: flex;
    justify-content: space-around;
  }

  .chart-container {
    width: 30vw;
    display: block;
    margin: 0 auto;
  }

  .table-container {
    width: 60vw;
  }

  /* .container:global(.canvas) {
    display: block;
    margin: 0 auto;
  } */
</style>
