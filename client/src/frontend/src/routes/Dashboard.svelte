<script lang="ts">
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
  import { userFundsStorage } from "../services/storage";
  import { l } from "../../../common/utils";
  import { type DashboardAsset } from "../../../common/helpers/interfaces";
  import { getAssetInfoByAddress } from "../services/helpers";

  // TODO: query stablecoins data from contract

  let dashboardAssetList: DashboardAsset[] = [];

  let data: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
      hoverBackgroundColor: string[];
    }[];
  };

  let options = {
    responsive: true,
    radius: "90%",
  };

  // removes additional digits on display
  function trimPrice(price: string) {
    // if price looks like "15000" return it unchanged
    if (!price.includes(".")) return price;

    // if price looks like "0.0000011" return it unchanged
    let [prefix, postfix]: string[] = price.split(".");
    if (prefix === "0") return price;

    // if price looks like "3.0000011" return "3.00"
    return `${prefix}.${postfix.slice(0, 2)}`;
  }

  // displays mainnet balances
  userFundsStorage.subscribe((value) => {
    const zero = new Decimal(0);
    const multiplier = new Decimal(100);

    const initialAssetList = value.map(
      ([addr, { holded: _holded, staked: _staked }]) => {
        const {
          asset: { symbol, exponent },
          price: _price,
        } = getAssetInfoByAddress(addr);
        const price = new Decimal(trimPrice(_price));
        const divider = new Decimal(10 ** exponent);
        // TODO: uncomment on mainnet
        // const holded = new Decimal(_holded.amount)
        //   .div(divider)
        //   .toDecimalPlaces(6);
        // const staked = new Decimal(_staked.amount)
        //   .div(divider)
        //   .toDecimalPlaces(6);
        const holded = new Decimal(10_000_100).div(divider).toDecimalPlaces(6);
        const staked = new Decimal(20_000_000).div(divider).toDecimalPlaces(6);
        const cost = price.mul(holded.add(staked)).toDecimalPlaces(2);

        let res: DashboardAsset = {
          asset: symbol,
          price,
          holded,
          staked,
          cost,
          allocation: zero,
        };

        return res;
      }
    );

    const totalCost = new Decimal(
      initialAssetList
        .map(({ cost }) => cost)
        .reduce((acc, cur) => acc.add(cur), zero)
    );

    dashboardAssetList = initialAssetList.map((item) => {
      const cost = new Decimal(item.cost);
      const allocation = totalCost.eq(zero)
        ? zero
        : cost.mul(multiplier).div(totalCost).toDecimalPlaces(2);

      return { ...item, allocation };
    });

    data = {
      labels: dashboardAssetList.map(({ asset }) => asset),
      datasets: [
        {
          data: dashboardAssetList.map(({ cost }) => cost.toNumber()),
          backgroundColor: generateColorList(dashboardAssetList.length, [
            "#F7464A",
            "#46BFBD",
            "#FDB45C",
          ]),
          hoverBackgroundColor: generateColorList(dashboardAssetList.length, [
            "#FF5A5E",
            "#5AD3D1",
            "#FFC870",
          ]),
        },
      ],
    };

    ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);
  });

  const stablecoin = "EEUR";

  function generateColorList(quantity: number, baseColorList: string[]) {
    let temp: string[] = [];

    const a = Math.floor(quantity / baseColorList.length);
    const b = quantity % baseColorList.length;

    for (let i = 0; i < a; i++) {
      temp = [...temp, ...baseColorList];
    }
    return [...temp, ...baseColorList.slice(0, b)];
  }
</script>

<div class="flex justify-between px-4" style="height: 85vh">
  <div class="w-4/12">
    <div class="ml-12">
      <h2>Current Period Balance: {1000} {stablecoin}</h2>
      <h2>Next period balance: {1000} {stablecoin}</h2>
      <h2>Portfolio Net Worth: {1000} {stablecoin}</h2>
    </div>
    {#if typeof data !== "undefined"}
      <Doughnut class="mt-6" {data} {options} />
    {/if}
  </div>

  <div class="w-7/12 overflow-x-auto">
    {#if dashboardAssetList.length}
      <table class="table table-compact w-full ">
        <thead class="bg-black flex text-white w-full pr-4">
          <tr class="flex w-full mb-1">
            {#each Object.keys(dashboardAssetList[0]) as key}
              <th class="bg-black p-4 w-1/4 text-center">{key}</th>
            {/each}
          </tr>
        </thead>

        <tbody
          class="bg-grey-light flex flex-col items-center justify-start overflow-y-scroll w-full"
          style="max-height: 72vh; min-height: fit-content;"
        >
          {#each dashboardAssetList as dashboardAsset}
            <tr class="flex w-full mt-4 first:mt-0">
              {#each Object.values(dashboardAsset) as rowValue}
                <td class="p-2.5 w-1/4 text-center">{rowValue}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
