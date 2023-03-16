import { CHAIN_TYPE, DAPP_ADDRESS } from "../envs";
import { decrypt } from "../../common/utils";
import { getGasPriceFromChainRegistryItem } from "../../common/signers";
import { init } from "../../common/workers/testnet-backend-workers";
import { getEncryptionKey } from "../middleware/key";
import { SEED_DAPP } from "../../common/config/testnet-config.json";
import { updatePoolsAndUsers as _updatePoolsAndUsers } from "../../common/helpers/api-helpers";
import { getChainRegistry, getPools } from "../middleware/api";

async function initContract() {
  const encryptionKey = getEncryptionKey();
  if (!encryptionKey) return;

  const seed = decrypt(SEED_DAPP, encryptionKey);
  if (!seed) return;

  const { cwQueryPoolsAndUsers, cwUpdatePoolsAndUsers, cwUpdateConfig } =
    await init(seed);

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

  const res = await _updatePoolsAndUsers(
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
