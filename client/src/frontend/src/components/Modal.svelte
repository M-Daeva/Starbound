<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import { txResStorage } from "../services/storage";
  import { closeModal, getImageUrl } from "../services/helpers";
  import { get } from "svelte/store";
  import { l } from "../../../common/utils";

  const [txStatus, txHash] = get(txResStorage);
  let dataToDisplay = `${txStatus}: ${txHash.slice(0, 3)}...${txHash.slice(
    txHash.length - 4
  )}`;

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(txHash);
      l({ txHash });
      dataToDisplay = "Copied!";
    } catch (error) {}
  }
</script>

<div
  in:scale
  out:fade
  class="flex flex-row justify-between w-72 p-2 rounded-lg text-center"
  style="background-color: rgb(42 48 60);"
>
  <button
    on:click={copyToClipboard}
    class="bg-transparent outline-none border-none my-auto"
  >
    <img
      class="hover:cursor-pointer w-10 mr-1"
      src={getImageUrl("copy.png")}
      alt="copy"
    />
  </button>
  <div class="w-full pl-2 text-center flex items-center">
    {dataToDisplay}
  </div>
  <button class="btn btn-circle m-0" on:click={closeModal}>❌</button>
</div>
