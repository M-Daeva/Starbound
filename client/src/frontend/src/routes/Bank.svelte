<script lang="ts">
  // @ts-nocheck

  import { Line } from "svelte-chartjs";

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

  // TODO: add checking on assets submit

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

  let stablecoin = "EEUR";
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
            />
          </div>
        </div>
        <div>
          <label class="mb-1" for="period">Current Investment Period End</label>
          <input class="w-full text-center mx-0 mb-5" type="date" id="period" />
        </div>
        <div class="controls">
          <button class="btn btn-secondary mt-2">Deposit</button>
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
            <button class="btn btn-secondary mt-2">Withdraw</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
