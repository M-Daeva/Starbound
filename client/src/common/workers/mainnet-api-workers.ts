import { l } from "../utils";
import { PoolExtracted, UserExtracted } from "../codegen/Starbound.types";
import {
  updatePoolsAndUsers as _updatePoolsAndUsers,
  getValidators as _getValidators,
} from "../helpers/api-helpers";

async function getValidators() {
  l("getValidators");
  try {
    let res = await _getValidators();
    l(res);
  } catch (error) {
    l(error, "\n");
  }
}

let poolsAndUsers: { pools: PoolExtracted[]; users: UserExtracted[] } = {
  pools: [
    {
      channel_id: "channel-0",
      denom:
        "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2",
      id: "1",
      port_id: "transfer",
      price: "13",
      symbol: "uatom",
    },
    {
      channel_id: "channel-42",
      denom:
        "ibc/46B44899322F3CD854D2D46DEEF881958467CDD4B3B10086DA49296BBED94BED",
      id: "497",
      port_id: "transfer",
      price: "4",
      symbol: "ujuno",
    },
  ],
  users: [
    {
      osmo_address: "osmo12xfuf5yjpcpm5y9wxqxhml7s64d0cfacr4tmeu",
      asset_list: [
        {
          asset_denom:
            "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2",
          wallet_address: "cosmos12xfuf5yjpcpm5y9wxqxhml7s64d0cfactwct0w",
          wallet_balance: "1",
        },
        {
          asset_denom:
            "ibc/46B44899322F3CD854D2D46DEEF881958467CDD4B3B10086DA49296BBED94BED",
          wallet_address: "juno12xfuf5yjpcpm5y9wxqxhml7s64d0cfacaumsgj",
          wallet_balance: "2",
        },
      ],
    },
  ],
};

async function updatePoolsAndUsers() {
  l("updatePoolsAndUsers");
  try {
    let _res = await _updatePoolsAndUsers(poolsAndUsers);
  } catch (error) {
    l(error, "\n");
  }
}

export { getValidators, updatePoolsAndUsers };
