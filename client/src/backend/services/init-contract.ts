import { CHAIN_TYPE, DAPP_ADDRESS } from "../envs";
import { getGasPriceFromChainRegistryItem } from "../../common/account/clients";
import { init } from "../account/testnet-backend-workers";
import { SEED_DAPP } from "../../common/config/osmosis-testnet-config.json";
import { updatePoolsAndUsers, getDappAddressAndDenomList } from "../helpers";
import { getChainRegistry, getPools } from "../middleware/api";
import { getSeed } from "./get-seed";
import { l } from "../../common/utils";

async function main() {
  try {
    const seed = await getSeed(SEED_DAPP);
    if (!seed) throw new Error("Seed is not found!");

    const helpers = await init();
    if (!helpers) return;

    const {
      owner,
      cwQueryPoolsAndUsers,
      cwUpdatePoolsAndUsers,
      cwUpdateConfig,
    } = helpers;
    if (!owner) return;

    // add dapp addresses
    const poolsStorage = await getPools();
    const chainRegistry = await getChainRegistry();

    const chain = chainRegistry.find((item) => item.denomNative === "uosmo");
    if (!chain) return;

    const gasPrice = getGasPriceFromChainRegistryItem(chain, CHAIN_TYPE);

    const dappAddressAndDenomList = getDappAddressAndDenomList(
      DAPP_ADDRESS,
      chainRegistry
    ) as unknown as string[][][]; // ts-codegen issue

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

    l("✔️ The contract was initialized!");
  } catch (error) {
    l(error);
  }
}

main();
