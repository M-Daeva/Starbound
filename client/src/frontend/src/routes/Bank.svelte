<script lang="ts">
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
  import {
    calcTimeDiff,
    displayTxLink,
    getTimeUntilRebalancing,
  } from "../services/helpers";
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
    STABLECOIN_SYMBOL,
    STABLECOIN_EXPONENT,
    chainRegistryStorage,
    ibcChannellsStorage,
    poolsStorage,
    userFundsStorage,
    userContractStorage,
    validatorsStorage,
    assetListStorage,
    authzHandlerListStorage,
    sortingConfigStorage,
    getRegistryChannelsPools,
    getValidators,
    cwHandlerStorage,
  } from "../services/storage";

  let paymentBalance = 0;
  let investPeriod = 0;

  // displays contract data
  userContractStorage.subscribe((value) => {
    paymentBalance = +value?.user?.deposited / 10 ** STABLECOIN_EXPONENT || 0;
    investPeriod = +value?.user?.day_counter || 0;
  });

  // TODO: add checking on assets submit

  let userToDisplay: User = {
    asset_list: [],
    day_counter: "",
    deposited: "",
    is_controlled_rebalancing: false,
  };

  async function deposit() {
    const chainRegistry = get(chainRegistryStorage);

    const assetList: Asset[] = get(assetListStorage).map(
      ({ address, asset: { symbol }, ratio }) => {
        const { denomIbc } = chainRegistry.find(
          (item) => item.symbol === symbol
        );

        let asset: Asset = {
          asset_denom: denomIbc,
          wallet_address: address,
          wallet_balance: "0",
          weight: `${ratio / 100}`,
          amount_to_send_until_next_epoch: "0", // contract doesn't read this field on deposit
        };

        const userFunds = get(userFundsStorage); // returns [] if userToDisplay is not registered
        if (userFunds.length) {
          const [_k, { holded, staked }] = userFunds.find(
            ([k]) => k === address
          );

          asset.wallet_balance = `${+holded.amount + +staked.amount}`;
        }

        return asset;
      }
    );

    userToDisplay = {
      ...userToDisplay,
      asset_list: assetList,
    };

    const userToSend: User = {
      ...userToDisplay,
      deposited: `${+userToDisplay.deposited * 10 ** STABLECOIN_EXPONENT}`,
      day_counter: `${calcTimeDiff(userToDisplay.day_counter)}`,
    };

    l({ userToSend });

    const tx = await _deposit(userToSend);

    l(displayTxLink(tx.transactionHash));
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
  } as any;

  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    CategoryScale
  );

  let time = "00:00";

  function getTime() {
    time = getTimeUntilRebalancing();
  }

  setInterval(getTime, 1000);
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
      <h2 class="text-center font-medium text-lg">Payment Schedule</h2>
      <Line class="mt-2" {data} options={{ responsive: true }} />
    </div>

    <div class="flex justify-around w-6/12">
      <div
        class="flex flex-col justify-start items-center p-3"
        style="background-color: rgb(42 48 60);"
      >
        <div>
          <div class="mt-12">
            <label class="inline-flex relative items-center cursor-pointer">
              <input
                type="checkbox"
                class="sr-only peer"
                bind:checked={userToDisplay.is_controlled_rebalancing}
                on:change={() => l(userToDisplay.is_controlled_rebalancing)}
              />
              <div
                class="w-11 h-6 peer-focus:outline-none peer-focus:ring-0 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"
              />
              <span class="ml-3 tex">Controlled Rebalancing</span>
            </label>
          </div>
          <div class="text-center mt-4">
            <label class="mb-1 text-center" for="payment"
              >Payment in {STABLECOIN_SYMBOL}</label
            >
            <input
              class="w-40 text-center mx-0 mb-5"
              type="number"
              min="0"
              max="1000000"
              id="payment"
              bind:value={userToDisplay.deposited}
            />
          </div>
        </div>
        <div>
          <label class="mb-1" for="period">Investment Period End</label>
          <input
            class="w-full text-center mx-0 mb-5"
            type="date"
            id="period"
            bind:value={userToDisplay.day_counter}
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
          <h2>Payment Balance: {paymentBalance} {STABLECOIN_SYMBOL}</h2>
          <h2>Investment Period Expires in: {investPeriod} days</h2>
        </div>

        <div
          class="flex flex-col justify-start items-center mt-28 pb-3"
          style="background-color: rgb(42 48 60);"
        >
          <div class="mt-6">
            <label class="mb-1" for="currentPeriod"
              >Withdrawal Amount in {STABLECOIN_SYMBOL}</label
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
