<script lang="ts">
  // @ts-nocheck

  import { l } from "../../../common/utils";
  import {
    deposit as _deposit,
    withdraw as _withdraw,
    queryPoolsAndUsers as _queryPoolsAndUsers,
  } from "../services/wallet";
  import { Line } from "svelte-chartjs";
  import { DENOMS } from "../../../common/helpers/assets";
  import { get } from "svelte/store";
  import type { Asset, User } from "../../../common/codegen/Starbound.types";
  import { calcTimeDiff } from "../services/helpers";
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    CategoryScale,
  } from "chart.js";
  import {
    chainRegistryStorage,
    ibcChannellsStorage,
    poolsStorage,
    userFundsStorage,
    validatorsStorage,
    assetListStorage,
    authzHandlerListStorage,
    sortingConfigStorage,
    getRegistryChannelsPools,
    getValidators,
    cwHandlerStorage,
  } from "../services/storage";

  // TODO: add checking on assets submit

  const stablecoinExponent = 6; // axelar USDC/ e-money EEUR

  let user: User = {
    asset_list: [],
    day_counter: "3",
    deposited_on_current_period: `${1_000_000}`,
    deposited_on_next_period: "0",
    is_controlled_rebalancing: false,
  };

  async function deposit() {
    const chainRegistry = get(chainRegistryStorage);

    const assetList: Asset[] = get(assetListStorage).map(
      ({ address, asset: { symbol }, ratio }) => {
        const { denom } = chainRegistry.find((item) => item.symbol === symbol);
        l({ denom });

        let asset: Asset = {
          asset_denom: denom,
          wallet_address: address,
          wallet_balance: "0",
          weight: `${ratio / 100}`,
          amount_to_send_until_next_epoch: "0", // contract doesn't read this field on deposit
        };

        const userFunds = get(userFundsStorage); // returns [] if user is not registered
        if (userFunds.length) {
          const [_k, { holded, staked }] = userFunds.find(
            ([k]) => k === address
          );

          asset.wallet_balance = `${+holded.amount + +staked.amount}`;
        }

        return asset;
      }
    );

    user = {
      ...user,
      asset_list: assetList,
    };

    const userToSend: User = {
      ...user,
      deposited_on_current_period: `${
        +user.deposited_on_current_period * 10 ** stablecoinExponent
      }`,
      deposited_on_next_period: `${
        +user.deposited_on_next_period * 10 ** stablecoinExponent
      }`,
      day_counter: `${calcTimeDiff(user.day_counter)}`,
    };

    l({ userToSend });

    await _deposit(userToSend);
  }

  const data = {
    labels: [
      "01/01/01",
      "02/01/01",
      "03/01/01",
      "04/01/01",
      "05/01/01",
      "06/01/01",
      "07/01/01",
    ],
    datasets: [
      {
        label: "Current schedule",
        fill: true,
        lineTension: 0.3,
        backgroundColor: "rgba(225, 204,230, .3)",
        borderColor: "rgb(205, 130, 158)",
        borderCapStyle: "butt",
        borderDash: [],
        borderDashOffset: 0.0,
        borderJoinStyle: "miter",
        pointBorderColor: "rgb(205, 130,1 58)",
        pointBackgroundColor: "rgb(255, 255, 255)",
        pointBorderWidth: 10,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "rgb(0, 0, 0)",
        pointHoverBorderColor: "rgba(220, 220, 220,1)",
        pointHoverBorderWidth: 2,
        pointRadius: 1,
        pointHitRadius: 10,
        data: [100, 200, 300, 400, 500, 600],
      },
      {
        label: "Estimated schedule",
        fill: true,
        lineTension: 0.3,
        backgroundColor: "rgba(184, 185, 210, .3)",
        borderColor: "rgb(35, 26, 136)",
        borderCapStyle: "butt",
        borderDash: [],
        borderDashOffset: 0.0,
        borderJoinStyle: "miter",
        pointBorderColor: "rgb(35, 26, 136)",
        pointBackgroundColor: "rgb(255, 255, 255)",
        pointBorderWidth: 10,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "rgb(0, 0, 0)",
        pointHoverBorderColor: "rgba(220, 220, 220, 1)",
        pointHoverBorderWidth: 2,
        pointRadius: 1,
        pointHitRadius: 10,
        data: [100, 250, 400, 550, 700, 700],
      },
    ],
  };

  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    CategoryScale
  );

  let time = "30:00:00";

  function getTime() {
    time = new Date().toTimeString().split(" ")[0];
  }

  setInterval(getTime, 1000);

  const stablecoin = "EEUR";
</script>

<div class="flex flex-col px-4 -mt-3 text-amber-200" style="height: 87vh">
  <p class="font-bold text-xl text-center">
    Rebalancing in<input
      class="bg-transparent outline-none border-none select-none w-24"
      type="text"
      bind:value={time}
      readonly
    />
  </p>

  <div class="flex flex-row justify-between">
    <div class="chart w-6/12">
      <h2 class="text-center font-medium text-lg">Cumulative Payments</h2>
      <Line class="mt-2" {data} options={{ responsive: true }} />
    </div>

    <div class="flex justify-around w-6/12">
      <div
        class="flex flex-col justify-start items-center p-3"
        style="background-color: rgb(42 48 60);"
      >
        <div>
          <div>
            <label class="mb-1" for="currentPeriod"
              >Current Period Payment in {stablecoin}</label
            >
            <input
              class="w-full text-center mx-0 mb-5"
              type="number"
              min="0"
              max="1000000"
              id="currentPeriod"
              bind:value={user.deposited_on_current_period}
            />
          </div>
          <div>
            <label class="mb-1" for="nextPeriod"
              >Next Period Payment in {stablecoin}</label
            >
            <input
              class="w-full text-center mx-0 mb-5"
              type="number"
              min="0"
              max="1000000"
              id="nextPeriod"
              bind:value={user.deposited_on_next_period}
            />
          </div>
        </div>
        <div>
          <label class="mb-1" for="period">Current Investment Period End</label>
          <input
            class="w-full text-center mx-0 mb-5"
            type="date"
            id="period"
            bind:value={user.day_counter}
          />
        </div>
        <div class="controls">
          <button class="btn btn-secondary mt-2" on:click={deposit}
            >Deposit</button
          >
        </div>
      </div>

      <div>
        <div class="font-medium text-lg">
          <h2>Current Period Balance: {1000.123456} {stablecoin}</h2>
          <h2>Next period balance: {0} {stablecoin}</h2>
          <h2>Current Period Expires in: {30} days</h2>
        </div>

        <div
          class="flex flex-col justify-start items-center mt-20 pb-3"
          style="background-color: rgb(42 48 60);"
        >
          <div class="mt-6">
            <label class="mb-1" for="currentPeriod"
              >Withdrawal Amount in {stablecoin}</label
            >
            <input
              class="w-full text-center mx-0 mb-5"
              type="number"
              min="0"
              max="1000000"
              id="currentPeriod"
            />
          </div>
          <div class="controls">
            <button
              class="btn btn-secondary mt-2"
              on:click={async () => l(await _queryPoolsAndUsers())}
              >Withdraw</button
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
