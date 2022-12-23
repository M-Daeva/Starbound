<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import { txHashStorage } from "../services/storage";
  import { get } from "svelte/store";
</script>

<div in:scale out:fade class="absolute right-28 bottom-10">
  {get(txHashStorage)}
</div>
