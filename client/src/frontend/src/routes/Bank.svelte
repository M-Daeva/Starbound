<script>
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

  import Button from "../components/Button.svelte";

  const data = {
    labels: ["January", "February", "March", "April", "May", "June", "July"],
    datasets: [
      {
        label: "My First dataset",
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
        data: [65, 59, 80, 81, 56, 55, 40],
      },
      {
        label: "My Second dataset",
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
        data: [28, 48, 40, 19, 86, 27, 90],
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
</script>

<div class="container flex justify-center my-2">
  <div class="chart w-2/6">
    <Line {data} options={{ responsive: true }} />
  </div>

  <div class="container">
    <div class="wallet-bar">
      <Button clickHandler={() => {}} text="Grant" />
    </div>

    <div class="deposit">
      <div class="inputs">
        <div class="input1">
          <label for="currentPeriod">Payment on current period</label>
          <input type="text" id="currentPeriod" />
        </div>
        <div class="input1">
          <label for="nextPeriod">Payment on next period</label>
          <input type="text" id="nextPeriod" />
        </div>
      </div>
      <div class="inputs">
        <div class="input2">
          <label for="period">Period in days</label>
          <input type="text" id="period" />
        </div>
      </div>
      <div class="controls">
        <Button clickHandler={() => {}} text="Deposit" />
        <Button clickHandler={() => {}} text="Withdraw" />
        <Button clickHandler={() => {}} text="Add asset" />
      </div>
    </div>
  </div>
</div>
