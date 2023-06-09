import { get } from "svelte/store";
import { addressStorage, cosmClient } from "../../services/storage";
import { StarboundOsmosisMessageComposer } from "../../../../common/codegen/StarboundOsmosis.message-composer";
import { CONTRACT_ADDRESS } from "../../../../common/config/osmosis-testnet-config.json";
import { Coin } from "@cosmjs/stargate";
import { fee } from "../../../../common/account/clients";
import { User } from "../../../../common/codegen/StarboundOsmosis.types";

// const EEUR_DENOM =
//         "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F";
const USDC_DENOM =
  "ibc/6F34E1BD664C36CE49ACC28E60D62559A5F96C4F9A6CCE4FC5A67B2852E24CFE";

export const signDeposit = async (user: User) => {
  const { deposited: tokenAmount } = user;
  const funds: Coin = {
    amount: tokenAmount,
    denom: USDC_DENOM,
  };
  const owner = get(addressStorage);
  const client = get(cosmClient);
  const msgComposer = new StarboundOsmosisMessageComposer(
    owner,
    CONTRACT_ADDRESS
  );

  const msg = msgComposer.deposit({ user }, tokenAmount ? [funds] : []);
  try {
    const transaction = await client.signAndBroadcast(owner, [msg], fee);
    return transaction;
  } catch (e) {
    throw Error(e);
  }
};
