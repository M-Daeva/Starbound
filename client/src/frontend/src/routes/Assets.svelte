<script lang="ts">
  interface Row {
    logo: string;
    asset: string;
    address: string;
    ratio: string;
    validator: string;
    isGranted: boolean;
  }

  let row = {
    logo: "https://raw.githubusercontent.com/cosmos/chain-registry/68df154360a341831f557ee30119dbbec1a77ca8/osmosis/images/osmo.svg",
    asset: "OSMO",
    address: "osmo1gjqnuhv52pd2a7ets2vhw9w9qa9knyhy7y9tgx",
    ratio: "0.2",
    validator: "Imperator",
    isGranted: false,
  };

  let rows: Row[] = [...new Array(35)].map((_) => row);
</script>

<div class="table-container">
  <div class="overflow-x-auto">
    <table class="table table-compact w-full">
      <thead>
        <tr>
          {#each Object.keys(row).map((item) => item[0].toUpperCase() + item.slice(1)) as key}
            <th>{key}</th>
          {/each}
        </tr>
      </thead>

      <tbody>
        {#each rows as { logo, asset, address, ratio, validator, isGranted }}
          <tr>
            <td class="w-1/12"><img class="w-1/2" src={logo} alt="logo" /></td>
            <td>{asset}</td>
            <td><input type="text" value={address} /></td>
            <td><input type="number" value={ratio} /></td>
            <td>{validator}</td>
            <td><button>{isGranted ? "Revoke" : "Grant"}</button></td>
            <td><button>❌</button></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
