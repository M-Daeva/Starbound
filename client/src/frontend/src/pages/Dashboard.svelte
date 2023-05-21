<script lang="ts">
  import { Doughnut } from "svelte-chartjs";
  import Decimal from "decimal.js";
  import { l } from "../../../common/utils";
  import { type DashboardAsset } from "../../../common/interfaces";
  import { trimDecimal } from "../../../common/utils";
  import {
    getAssetInfoByAddress,
    generateColorList,
    getOsmoPrice,
  } from "../services/helpers";
  import {
    STABLECOIN_SYMBOL,
    STABLECOIN_EXPONENT,
    userFundsStorage,
    userContractStorage,
  } from "../services/storage";
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    CategoryScale,
  } from "chart.js";

  let paymentBalance = 0;
  let portfolioNetWorth = 0;

  let dashboardAssetList: DashboardAsset[] = [];

  let data: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
      hoverBackgroundColor: string[];
    }[];
  };

  const options = {
    responsive: true,
    radius: "90%",
    plugins: {
      legend: {
        labels: {
          color: "rgb(253 230 138)",
        },
      },
    },
  };

  // displays contract data
  userContractStorage.subscribe((user) => {
    paymentBalance = +(user?.deposited || "") / 10 ** STABLECOIN_EXPONENT;
  });

  // displays mainnet balances
  userFundsStorage.subscribe((value) => {
    const zero = new Decimal(0);
    const multiplier = new Decimal(100);

    let initialAssetList: DashboardAsset[] = [];

    for (let [addr, { holded: _holded, staked: _staked }] of value) {
      const assetInfoByAddress = getAssetInfoByAddress(addr);
      if (!assetInfoByAddress) continue;
      l({ addr, assetInfoByAddress });
      let {
        asset: { symbol, exponent },
        price: _price,
      } = assetInfoByAddress;

      if (symbol === "OSMO") {
        _price = getOsmoPrice().toString();
      }

      const price = new Decimal(trimDecimal(_price));
      const divider = new Decimal(10 ** exponent);

      const holded = new Decimal(_holded.amount)
        .div(divider)
        .toDecimalPlaces(exponent);
      const staked = new Decimal(_staked.amount)
        .div(divider)
        .toDecimalPlaces(exponent);

      const cost = new Decimal(trimDecimal(price.mul(holded.add(staked))));

      let res: DashboardAsset = {
        asset: symbol,
        price,
        holded,
        staked,
        cost,
        allocation: zero,
      };

      initialAssetList.push(res);
    }

    const totalCost = initialAssetList
      .map(({ cost }) => cost)
      .reduce((acc, cur) => acc.add(cur), zero);

    portfolioNetWorth = +trimDecimal(totalCost);

    dashboardAssetList = initialAssetList.map((item) => {
      const { cost } = item;
      const allocation = totalCost.eq(zero)
        ? zero
        : cost.mul(multiplier).div(totalCost).toDecimalPlaces(2);

      return { ...item, allocation };
    });

    dashboardAssetList.sort((a, b) => (a.allocation > b.allocation ? -1 : 1));

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
</script>

<div
  class="flex flex-col justify-center sm:flex-row sm:justify-between px-4 pb-4"
>
  <div class="w-full sm:w-4/12">
    <div
      class="text-base sm:text-sm md:text-base ml-4 sm:ml-0 md:ml-4 lg:ml-12"
    >
      <h2>Payment Balance: {paymentBalance} {STABLECOIN_SYMBOL}</h2>
      <h2>Portfolio Net Worth: {portfolioNetWorth} {STABLECOIN_SYMBOL}</h2>
    </div>
    {#if typeof data !== "undefined"}
      <Doughnut class="mt-6" {data} {options} />
    {/if}
  </div>

  <div class="mt-3 sm:mt-0 w-full sm:w-7/12 overflow-x-auto">
    {#if dashboardAssetList.length}
      <table class="table table-compact w-full overflow-x-scroll">
        <thead class="bg-black flex text-white w-full">
          <tr class="flex justify-between w-full mb-1 pr-6">
            {#each Object.keys(dashboardAssetList[0]) as key}
              <th class="bg-black py-4 w-24 text-center">{key}</th>
            {/each}
          </tr>
        </thead>

        <tbody
          class="bg-grey-light flex flex-col items-center justify-start overflow-y-scroll w-full"
          style="max-height: 72vh; min-height: fit-content;"
        >
          {#each dashboardAssetList as dashboardAsset}
            <tr
              class="flex w-full mt-4 first:mt-0 justify-between pr-3"
              style="background-color: rgb(42 48 60);"
            >
              {#each Object.values(dashboardAsset) as rowValue}
                <td class="py-2.5 w-24 text-center bg-inherit border-b-0"
                  >{rowValue}</td
                >
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
