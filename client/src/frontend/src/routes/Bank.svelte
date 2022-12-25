<script lang="ts">
  import { l } from "../../../common/utils";
  import {
    deposit as _deposit,
    withdraw as _withdraw,
    queryPoolsAndUsers as _queryPoolsAndUsers,
    queryUser,
  } from "../services/wallet";
  import { Bar } from "svelte-chartjs";
  import { DENOMS } from "../../../common/helpers/assets";
  import { get } from "svelte/store";
  import type { Asset, User } from "../../../common/codegen/Starbound.types";
  import type { AssetListItem } from "../../../common/helpers/interfaces";
  import {
    calcTimeDiff,
    getTimeUntilRebalancing,
    displayModal,
    generateColorList,
    timeDiffToDate,
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
    BarElement,
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
    isModalActiveStorage,
    txHashStorage,
    sortingConfigStorage,
    getRegistryChannelsPools,
    getValidators,
    cwHandlerStorage,
    setUserContractStorage,
  } from "../services/storage";

  let paymentBalance = 0;
  let investPeriod = 0;
  let withdrawalAmountToDisplay = "";

  let time = "00:00";

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

  // displays contract data
  userContractStorage.subscribe((value) => {
    paymentBalance =
      +(value?.user?.deposited || "") / 10 ** STABLECOIN_EXPONENT;
    investPeriod = +(value?.user?.day_counter || "");

    data.labels = [...Array(investPeriod).keys()].map((i) => i + 1);

    let cuSum = 0;
    data.datasets[0].data = [...Array(investPeriod).keys()].map(() => {
      cuSum += paymentBalance / investPeriod;
      return cuSum;
    });

    userToDisplay.day_counter = timeDiffToDate(investPeriod);
    userToDisplay.is_controlled_rebalancing =
      value?.user?.is_controlled_rebalancing || false;

    estimatePayments(true);
  });

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
      deposited: `${
        Math.abs(+userToDisplay.deposited) * 10 ** STABLECOIN_EXPONENT
      }`,
      day_counter: `${calcTimeDiff(userToDisplay.day_counter)}`,
    };

    l({ userToSend });

    try {
      const tx = await _deposit(userToSend);
      displayModal(tx.transactionHash);
    } catch (error) {}

    await setUserContractStorage();
  }

  async function withdraw() {
    let withdrawalAmountToSend =
      Math.abs(+withdrawalAmountToDisplay) * 10 ** STABLECOIN_EXPONENT;

    try {
      const tx = await _withdraw(withdrawalAmountToSend);

      displayModal(tx.transactionHash);
    } catch (error) {}

    await setUserContractStorage();
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
    time = getTimeUntilRebalancing();
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
      <h2 class="text-center font-medium text-lg">
        Payment Cumulative Sum ({STABLECOIN_SYMBOL}) vs Time (Days)
      </h2>
      <Bar class="mt-2" {data} options={{ responsive: true }} />
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
              on:input={() => estimatePayments(true)}
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
            on:input={() => estimatePayments(true)}
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
              bind:value={withdrawalAmountToDisplay}
              on:input={() => estimatePayments(false)}
            />
          </div>
          <div class="controls">
            <button class="btn btn-secondary mt-2" on:click={withdraw}
              >Withdraw</button
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
