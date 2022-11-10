<script lang="ts">
  import { DENOMS } from "../../../common/helpers/assets";

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

  let denoms = Object.keys(DENOMS);
</script>

<div class="container flex justify-around bg-indigo-600 my-2">
  <select value={DENOMS[0]}>
    {#each denoms as denom}
      <option value={denom}>
        {denom}
      </option>
    {/each}
  </select>
  <input type="text" />
  <button>Add</button>
</div>

<div class="table-container">
  <div class="overflow-x-auto">
    <table class="table table-compact w-full">
      <thead class="bg-black flex text-white w-full">
        <tr class="flex w-full mb-4">
          {#each Object.keys(row).map((item) => item[0].toUpperCase() + item.slice(1)) as key}
            <th class="p-4 w-1/4">
              {key}
              <a href="#"
                ><svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="ml-1 w-3 h-3"
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 320 512"
                  ><path
                    d="M27.66 224h264.7c24.6 0 36.89-29.78 19.54-47.12l-132.3-136.8c-5.406-5.406-12.47-8.107-19.53-8.107c-7.055 0-14.09 2.701-19.45 8.107L8.119 176.9C-9.229 194.2 3.055 224 27.66 224zM292.3 288H27.66c-24.6 0-36.89 29.77-19.54 47.12l132.5 136.8C145.9 477.3 152.1 480 160 480c7.053 0 14.12-2.703 19.53-8.109l132.3-136.8C329.2 317.8 316.9 288 292.3 288z"
                  /></svg
                ></a
              >
            </th>
          {/each}
        </tr>
      </thead>

      <tbody
        class="bg-grey-light flex flex-col items-center justify-between overflow-y-scroll w-full"
        style="height: 50vh;"
      >
        {#each rows as { logo, asset, address, ratio, validator, isGranted }}
          <tr class="flex w-full mb-4">
            <td class="p-4 w-1/12"
              ><img class="w-1/2" src={logo} alt="logo" /></td
            >
            <td class="p-4 w-1/4">{asset}</td>
            <td class="p-4 w-1/4"><input type="text" value={address} /></td>
            <td class="p-4 w-1/4"><input type="number" value={ratio} /></td>
            <td class="p-4 w-1/4">{validator}</td>
            <td class="p-4 w-1/4"
              ><button>{isGranted ? "Revoke" : "Grant"}</button></td
            >
            <td class="p-4 w-1/12"><button>❌</button></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
