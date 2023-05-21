<script lang="ts">
  import { l } from "../../../common/utils";
  import { Bar } from "svelte-chartjs";
  import { get } from "svelte/store";
  import { init } from "../account/wallet";
  import type {
    Asset,
    User,
  } from "../../../common/codegen/StarboundOsmosis.types";
  import {
    calcTimeDiff,
    getTimeUntilRebalancing,
    displayModal,
    timeDiffToDate,
  } from "../services/helpers";
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LinearScale,
    CategoryScale,
    BarElement,
  } from "chart.js";
  import {
    CHAIN_TYPE,
    STABLECOIN_SYMBOL,
    STABLECOIN_EXPONENT,
    chainRegistryStorage,
    userFundsStorage,
    userContractStorage,
    assetListStorage,
    // setUserContractStorage,
  } from "../services/storage";

  let paymentBalance = 0;
  let investPeriod = 0;
  let withdrawalAmountToDisplay = "";

  let timeStr = "Distribution in 00:00";

  let tab: "deposit" | "withdraw" = "deposit";

  // TODO: add checking on assets submit

  let userToDisplay: User = {
    asset_list: [],
    day_counter: "",
    deposited: "",
    is_controlled_rebalancing: false,
  };

  let data = {
    labels: [],
    datasets: [
      {
        label: "Current",
        data: [],
        backgroundColor: ["rgba(255, 218, 128,0.4)"],
        borderWidth: 2,
        borderColor: ["rgba(255, 218, 128, 1)"],
      },
      {
        label: "Estimated",
        data: [],
        backgroundColor: ["rgba(170, 128, 252,0.4)"],
        borderWidth: 2,
        borderColor: ["rgba(170, 128, 252, 1)"],
      },
    ],
  } as any;

  const color = "rgb(253 230 138)";

  const options = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          color,
        },
      },
      x: {
        ticks: {
          color,
        },
      },
    },
  };

  // displays contract data
  userContractStorage.subscribe((user) => {
    paymentBalance = +(user?.deposited || "") / 10 ** STABLECOIN_EXPONENT;
    investPeriod = +(user?.day_counter || "");

    data.labels = [...Array(investPeriod).keys()].map((i) => i + 1);

    let cuSum = 0;
    data.datasets[0].data = [...Array(investPeriod).keys()].map(() => {
      cuSum += paymentBalance / investPeriod;
      return cuSum;
    });

    userToDisplay.day_counter = timeDiffToDate(investPeriod);
    userToDisplay.is_controlled_rebalancing =
      user?.is_controlled_rebalancing || false;

    estimatePayments(true);
  });

  async function deposit() {
    const chainRegistry = get(chainRegistryStorage);

    const assetList: Asset[] = get(assetListStorage).map(
      ({ address, asset: { symbol }, ratio }) => {
        const chain = chainRegistry.find((item) => item.symbol === symbol);
        let { denomIbc } = chain;
        if (chain.denomNative === "uosmo") denomIbc = "uosmo";

        let asset: Asset = {
          asset_denom: denomIbc,
          wallet_address: address,
          wallet_balance: "0",
          weight: `${Math.abs(ratio) / 100}`,
          amount_to_send_until_next_epoch: "0", // contract doesn't read this field on deposit
        };

        // try to update wallet_balance
        const userFunds = get(userFundsStorage); // returns [] if userToDisplay is not registered
        if (userFunds.length) {
          const userFundsCurrent = userFunds.find(([k]) => k === address);

          if (userFundsCurrent) {
            const [_k, { holded, staked }] = userFundsCurrent;
            asset.wallet_balance = `${+holded.amount + +staked.amount}`;
          }
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
      deposited: `${
        Math.abs(+userToDisplay.deposited) * 10 ** STABLECOIN_EXPONENT
      }`,
      day_counter: `${calcTimeDiff(userToDisplay.day_counter)}`,
    };

    l({ userToSend });

    try {
      const { deposit: _deposit, setUserContractStorage } = await init(
        get(chainRegistryStorage),
        CHAIN_TYPE
      );
      const tx = await _deposit(userToSend);
      displayModal(tx);
      await setUserContractStorage();
    } catch (error) {}
  }

  async function withdraw() {
    let withdrawalAmountToSend =
      Math.abs(+withdrawalAmountToDisplay) * 10 ** STABLECOIN_EXPONENT;

    try {
      const { withdraw: _withdraw, setUserContractStorage } = await init(
        get(chainRegistryStorage),
        CHAIN_TYPE
      );
      const tx = await _withdraw(withdrawalAmountToSend);
      displayModal(tx);
      await setUserContractStorage();
    } catch (error) {}
  }

  function estimatePayments(isDeposit: boolean) {
    const timeDiff = calcTimeDiff(userToDisplay.day_counter) || investPeriod;
    const timeDiffArray = [...Array(timeDiff).keys()];

    const offset = isDeposit
      ? Math.abs(+userToDisplay.deposited)
      : -Math.abs(+withdrawalAmountToDisplay);

    if (isDeposit) {
      withdrawalAmountToDisplay = "";
    } else {
      userToDisplay.deposited = "";
    }

    data.labels = (
      data.labels.length > timeDiff
        ? [...Array(investPeriod).keys()]
        : timeDiffArray
    ).map((i) => i + 1);

    let cuSum = 0;
    data.datasets[1].data = timeDiffArray.map(() => {
      cuSum += (paymentBalance + offset) / timeDiff;
      return cuSum;
    });
  }

  function getTime() {
    timeStr = `Distribution in ${getTimeUntilRebalancing()}`;
  }

  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale
  );

  getTime();
  setInterval(getTime, 1000);
</script>

<div class="flex flex-col px-4 -mt-3 text-amber-200 pt-2 sm:pt-0 pb-4">
  <p class="font-bold text-xl text-center">
    <input
      class="bg-transparent outline-none border-none select-none text-center"
      type="text"
      bind:value={timeStr}
      readonly
    />
  </p>

  <div class="flex flex-col sm:flex-row justify-between">
    <div class="chart w-full sm:w-6/12">
      <h2 class="text-center font-medium text-lg">
        Payment Cumulative Sum ({STABLECOIN_SYMBOL}) vs Time (Days)
      </h2>
      <Bar class="mt-2" {data} {options} />

      <div>
        <div class="mt-3 mb-5 font-medium text-sm sm:text-base">
          <h2>Payment Balance: {paymentBalance} {STABLECOIN_SYMBOL}</h2>
          <h2>Investment Period Expires in: {investPeriod} days</h2>
        </div>
      </div>
    </div>

    <div class="flex flex-col justify-around w-60 mx-auto mt-1">
      <div
        class="flex flex-col justify-start items-center min-w-fit pb-4 h-96"
        style="background-color: rgb(42 48 60);"
      >
        <div class="flex w-full text-center">
          <a
            class={"hover:cursor-pointer hover:no-underline text-amber-200 p-3 w-6/12" +
              (tab === "deposit" ? " bg-black" : "")}
            href={null}
            on:click|preventDefault={() => (tab = "deposit")}>Deposit</a
          >
          <a
            class={"hover:cursor-pointer hover:no-underline text-amber-200 p-3 w-6/12" +
              (tab !== "deposit" ? " bg-black" : "")}
            href={null}
            on:click|preventDefault={() => (tab = "withdraw")}>Withdraw</a
          >
        </div>

        {#if tab === "deposit"}
          <div>
            <div class="mt-6">
              <label class="inline-flex relative items-center cursor-pointer">
                <input
                  type="checkbox"
                  class="sr-only peer"
                  bind:checked={userToDisplay.is_controlled_rebalancing}
                />
                <div
                  class="w-11 h-6 peer-focus:outline-none peer-focus:ring-0 rounded-full peer bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"
                />
                <span class="ml-3 tex">Rebalancing</span>
              </label>
            </div>
            <div class="text-center mt-3">
              <label class="mb-1 text-center" for="payment"
                >Payment in {STABLECOIN_SYMBOL}</label
              >
              <input
                class="w-40 text-center mx-0 mb-5 bg-stone-700"
                type="number"
                min="0"
                max="1000000"
                id="payment"
                bind:value={userToDisplay.deposited}
                on:input={() => estimatePayments(true)}
              />
            </div>
          </div>
          <div>
            <label class="mb-1" for="period">Investment Period End</label>
            <input
              class="w-full text-center mx-0 mb-5 bg-stone-700"
              type="date"
              id="period"
              bind:value={userToDisplay.day_counter}
              on:input={() => estimatePayments(true)}
            />
          </div>
          <div class="controls">
            <button class="btn btn-secondary mt-4 w-28" on:click={deposit}
              >Deposit</button
            >
          </div>
        {:else}
          <div class="mt-16 text-center">
            <label class="mb-1.5" for="currentPeriod"
              >Withdrawal Amount in {STABLECOIN_SYMBOL}</label
            >
            <input
              class="w-40 text-center mx-0 mb-3 bg-stone-700"
              type="number"
              min="0"
              max="1000000"
              id="currentPeriod"
              bind:value={withdrawalAmountToDisplay}
              on:input={() => estimatePayments(false)}
            />
          </div>
          <div class="controls">
            <button class="btn btn-secondary mt-28 w-28" on:click={withdraw}
              >Withdraw</button
            >
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
