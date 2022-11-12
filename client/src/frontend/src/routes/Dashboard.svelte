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

  let options = {
    responsive: true,
    radius: "90%",
  };

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

  const stablecoin = "EEUR";
</script>

<div class="flex justify-between px-4" style="height: 85vh">
  <div class="w-4/12">
    <div class="ml-12">
      <h2>Current Period Balance: {1000} {stablecoin}</h2>
      <h2>Next period balance: {1000} {stablecoin}</h2>
      <h2>Portfolio Net Worth: {1000} {stablecoin}</h2>
    </div>
    <Doughnut class="mt-6" {data} {options} />
  </div>

  <div class="w-7/12 overflow-x-auto">
    <table class="table table-compact w-full ">
      <thead class="bg-black flex text-white w-full pr-4">
        <tr class="flex w-full mb-1">
          {#each Object.keys(row) as key}
            <th class="bg-black p-4 w-1/4 text-center">{key}</th>
          {/each}
        </tr>
      </thead>

      <tbody
        class="bg-grey-light flex flex-col items-center justify-start overflow-y-scroll w-full"
        style="max-height: 72vh; min-height: fit-content;"
      >
        {#each rows as row}
          <tr class="flex w-full mt-4 first:mt-0">
            {#each Object.values(row) as rowValue}
              <td class="p-2.5 w-1/4 text-center">{rowValue}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
