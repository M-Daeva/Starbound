<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import { txHashStorage } from "../services/storage";
  import { get } from "svelte/store";
  import { l } from "../../../common/utils";

  let txHash = get(txHashStorage);
  let hashToDisplay = `${txHash.slice(0, 3)}...${txHash.slice(
    txHash.length - 4
  )}`;

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(txHash);
      l({ txHash });
      hashToDisplay = "Copied!";
    } catch (error) {}
  }
</script>

<div
  in:scale
  out:fade
  class="flex flex-row justify-between w-72 absolute right-10 bottom-10 p-5 rounded-lg text-center"
  style="background-color: rgb(42 48 60);"
>
  <div>{hashToDisplay}</div>
  <button
    on:click={copyToClipboard}
    class="bg-transparent outline-none border-none my-auto"
  >
    <img
      class="hover:cursor-pointer w-5 mr-1"
      src="src/public/copy.png"
      alt="copy"
    />
  </button>
</div>
