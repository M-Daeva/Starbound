<script lang="ts">
  import Button from "./components/Button.svelte";
  import { createRequest, l } from "./utils";
  import { baseURL } from "./config";
  import {
    queryPoolsAndUsers,
    debugQueryPoolsAndUsers,
    deposit,
    withdraw,
    grantStakeAuth,
    queryAssets,
  } from "./services/wallet";
  import { onMount } from "svelte";
  import Radio from "./components/Radio.svelte";
  import {
    UserExtracted,
    PoolExtracted,
    AssetExtracted,
    User,
    Asset,
  } from "./helpers/interfaces";
  import {
    DENOMS,
    AssetSymbol,
    AssetDenom,
    getSymbolByDenom,
  } from "./helpers/assets";
  import { getAddrByPrefix } from "./clients";

  let newAsset: Asset = {
    amount_to_send_until_next_epoch: "0",
    asset_denom: DENOMS.ATOM,
    wallet_address: "",
    wallet_balance: "0",
    weight: "0",
  };

  let user: User = {
    asset_list: [],
    day_counter: "0",
    deposited_on_current_period: "0",
    deposited_on_next_period: "0",
    is_controlled_rebalancing: false,
  };

  let newAssetSymbol: string = "ATOM";
  let newAssetWeight: string = "0";

  let assetOptions: Asset[] = [
    {
      asset_denom: DENOMS.ATOM,
      wallet_address: "cosmos1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyklkm75",
      wallet_balance: "0",
      weight: "0.5",
      amount_to_send_until_next_epoch: "0",
    },

    {
      asset_denom: DENOMS.JUNO,
      wallet_address: "juno1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyqd4qeg",
      wallet_balance: "0",
      weight: "0.5",
      amount_to_send_until_next_epoch: "0",
    },
  ];

  let textAreaContent: string = "";

  async function updateTa() {
    textAreaContent = "";

    const { owner, tx } = await debugQueryPoolsAndUsers();
    const { tx: tx2 } = await queryAssets(owner);
    l({ tx });
    l({ tx2 });

    let deposited = 0;

    if (tx2 !== undefined && tx2.asset_list.length !== 0) {
      let user = tx.users.find((user) => {
        let addr = user.asset_list.map((asset) => asset.wallet_address)[0];
        return getAddrByPrefix(addr, "osmo") === owner;
      });

      deposited =
        +user?.deposited_on_current_period + +user?.deposited_on_next_period;

      textAreaContent += `Deposited ${
        Number.isNaN(deposited) ? 0 : deposited
      }\n`;

      for (let asset of tx2.asset_list) {
        // let str = `${asset.wallet_balance} coins on ${asset.wallet_address}\n`;
        let str = `${asset.wallet_address}\n`;
        textAreaContent += str;
      }
    } else {
      textAreaContent += `Deposited 0\n`;
    }

    assetOptions = assetOptions.map((item) => {
      let prefix: string = "juno";
      if (item.asset_denom === DENOMS.ATOM) prefix = "cosmos";

      return { ...item, wallet_address: getAddrByPrefix(owner, prefix) };
    });

    l({ user });
    l({ textAreaContent });
  }

  onMount(updateTa);

  const options = [
    {
      value: true,
      label: "Controlled",
    },
    {
      value: false,
      label: "Proportional",
    },
  ];

  function addAsset() {
    let asset = assetOptions.find((item) => {
      return (
        getSymbolByDenom(item.asset_denom) ===
        newAssetSymbol.toLocaleUpperCase()
      );
    });
    newAsset = {
      ...newAsset,
      wallet_address: asset.wallet_address,
      asset_denom: asset.asset_denom,
      weight: newAssetWeight,
    };
    user.asset_list = [...user.asset_list, newAsset];
    l(user);
  }

  async function updateUserAndDeposit() {
    let res = await deposit(user);
    l(res);
    await updateTa();
  }
</script>

<div class="container">
  <div class="wallet-bar">
    <Button clickHandler={grantStakeAuth} text="Grant" />
  </div>

  <div class="deposit">
    <textarea
      name=""
      id=""
      cols="70"
      rows="5"
      contenteditable="false"
      bind:textContent={textAreaContent}
    />
  </div>

  <div class="deposit">
    <div class="inputs">
      <Radio
        {options}
        fontSize={16}
        legend="Select rebalancing mode"
        bind:userSelected={user.is_controlled_rebalancing}
      />
      <div class="input1">
        <label for="currentPeriod">Payment on current period</label>
        <input
          type="text"
          id="currentPeriod"
          bind:value={user.deposited_on_current_period}
        />
      </div>
      <div class="input1">
        <label for="nextPeriod">Payment on next period</label>
        <input
          type="text"
          id="nextPeriod"
          bind:value={user.deposited_on_next_period}
        />
      </div>
    </div>
    <div class="inputs">
      <div class="input2">
        <label for="period">Period in days</label>
        <input type="text" id="period" bind:value={user.day_counter} />
      </div>
      <div class="input2">
        <label for="asset">Choose asset to add</label>
        <input type="text" id="asset" bind:value={newAssetSymbol} />
      </div>
      <div class="input2">
        <label for="period">Ratio</label>
        <input type="string" id="period" bind:value={newAssetWeight} />
      </div>
    </div>
    <div class="controls">
      <Button clickHandler={updateUserAndDeposit} text="Deposit" />
      <Button
        clickHandler={async () => {
          await withdraw(+user.deposited_on_current_period);
          await updateTa();
        }}
        text="Withdraw"
      />
      <Button clickHandler={addAsset} text="Add asset" />
    </div>
  </div>

  {#each user.asset_list as item, index}
    <div class="asset">
      {getSymbolByDenom(item.asset_denom)} - {item.weight}
    </div>
    <br />
  {/each}
</div>

<style>
  :global(body) {
    background-color: rgb(52, 42, 11);
    color: #0084f6;
    background: #090017
      linear-gradient(
        136deg,
        rgba(217, 51, 137, 0.4) 0%,
        rgba(59, 195, 243, 0.4) 50%,
        rgba(15, 255, 135, 0.4) 100%
      );
  }

  textarea {
    color: white;
    width: 100%;
    height: 150px;
    padding: 12px 20px;
    box-sizing: border-box;
    border: 2px solid #ccc;
    border-radius: 4px;
    background-color: black;
    font-size: 16px;
    resize: none;
  }

  .content {
    display: grid;
    grid-template-columns: 20% 80%;
    grid-column-gap: 10px;
  }

  div {
    display: flex;
    margin-left: auto;
    margin-right: auto;
    text-align: center;
    justify-content: center;
    align-items: center;
  }

  div.display,
  div.deposit {
    color: #d117e7;
  }

  .container {
    flex-direction: column;
    text-align: center;
  }

  .deposit,
  .collateral,
  .nft {
    padding-top: 5px;
    padding-bottom: 5px;
    margin-top: 15px;
    width: 55vw;
    flex-direction: column;
    background-color: #1b2b448f;
    border-radius: 20px;
  }

  .inputs,
  select {
    flex-direction: row;
    width: 100%;
  }

  .input1,
  .input2,
  select {
    flex-direction: column;
  }

  input {
    margin-top: 10px;
    width: 30vw;
    text-align: center;
    background: transparent;
    color: white;
    outline: none;
    border-radius: 5px;
  }

  .input1 input,
  .input2 input,
  select {
    width: 100%;
  }

  .controls {
    margin-top: 10px;
    width: 30vw;
    justify-content: space-between;
  }

  select {
    background-color: rgba(0, 0, 0, 0.3);
    color: white;
    outline: none;
    border-radius: 5px;
    width: 150px;
    text-align: center;
    margin-top: 10px;
    margin-bottom: 10px;
  }

  div.wallet-bar {
    padding-top: 5px;
    padding-bottom: 5px;
    margin-top: 20px;
    width: 95vw;
    flex-direction: column;
    border-radius: 20px;
    display: flex;
    flex-wrap: wrap;
    align-content: flex-end;
  }

  div.deposit {
    margin-bottom: 10px;
  }

  div.asset {
    padding-top: 5px;
    padding-bottom: 5px;
    margin-top: 2px;
    width: 55vw;
    flex-direction: column;
    background-color: #1b2b448f;
    border-radius: 20px;

    border-width: 1px;
    border-color: white;
  }
</style>
