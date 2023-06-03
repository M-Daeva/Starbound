<script>
    import {connectWallet} from "../utils/wallet";
    import {addressStorage} from "../services/storage";
    let address;

    addressStorage.subscribe(value => {
      address = value;
    });
</script>
<div class="flex flex-col items-center justify-center h-screen">
<div>{address}</div>
    <button on:click={() => connectWallet('keplr')}>connect keplr</button>
    <button on:click={() => connectWallet('cosmostation')}>connect cosmostation</button>
    <button on:click={() => connectWallet('leap')}>connect leap</button>
</div>