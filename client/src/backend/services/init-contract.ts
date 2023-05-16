import { CHAIN_TYPE, DAPP_ADDRESS } from "../envs";
import { getGasPriceFromChainRegistryItem } from "../../common/signers";
import { init } from "../../common/workers/testnet-backend-workers";
import { SEED_DAPP } from "../../common/config/testnet-config.json";
import {
  updatePoolsAndUsers,
  getDappAddressAndDenomList,
} from "../../common/helpers/api-helpers";
import { getChainRegistry, getPools } from "../middleware/api";
import { getSeed } from "./get-seed";

async function initContract() {
  const helpers = await init(await getSeed(SEED_DAPP));
  if (!helpers) return;

  const { cwQueryPoolsAndUsers, cwUpdatePoolsAndUsers, cwUpdateConfig } =
    helpers;

  // add dapp addresses
  const poolsStorage = await getPools();
  const chainRegistry = await getChainRegistry();

  const chain = chainRegistry.find((item) => item.denomNative === "uosmo");
  if (!chain) return;

  const gasPrice = getGasPriceFromChainRegistryItem(chain, CHAIN_TYPE);

  // @ts-ignore
  const dappAddressAndDenomList: string[][][] = getDappAddressAndDenomList(
    DAPP_ADDRESS,
    chainRegistry
  );

  await cwUpdateConfig(
    {
      dappAddressAndDenomList,
    },
    gasPrice
  );

  // add pools
  const poolsAndUsers = await cwQueryPoolsAndUsers();

  const res = await updatePoolsAndUsers(
    chainRegistry,
    poolsAndUsers,
    poolsStorage,
    CHAIN_TYPE
  );
  if (!res) return;

  const { pools, users } = res;
  await cwUpdatePoolsAndUsers(pools, users, gasPrice);
}

initContract();
