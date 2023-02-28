import { createRequest } from "../common/utils";
import E from "./config";
import { decrypt } from "../common/utils";
import { getGasPriceFromChainRegistryItem } from "../common/signers";
import { init } from "../common/workers/testnet-backend-workers";
import { ROUTES as API_ROUTES } from "./routes/api";
import { getEncryptionKey } from "./middleware/key";
import { SEED_DAPP } from "../common/config/testnet-config.json";
import { updatePoolsAndUsers as _updatePoolsAndUsers } from "../common/helpers/api-helpers";
import "./services/ssl-fix";
import {
  ChainRegistryStorage,
  PoolsStorage,
} from "../common/helpers/interfaces";

const req = createRequest({ baseURL: E.BASE_URL + "/api" });

async function initContract() {
  const encryptionKey = getEncryptionKey();
  if (!encryptionKey) return;

  const seed = decrypt(SEED_DAPP, encryptionKey);
  if (!seed) return;

  const { cwQueryPoolsAndUsers, cwUpdatePoolsAndUsers, cwUpdateConfig } =
    await init(seed);

  // add dapp addresses
  const poolsStorage: PoolsStorage = await req.get(API_ROUTES.getPools);
  const chainRegistry: ChainRegistryStorage = await req.get(
    API_ROUTES.getChainRegistry
  );

  const chain = chainRegistry.find((item) => item.denomNative === "uosmo");
  if (!chain) return;

  const gasPrice = getGasPriceFromChainRegistryItem(chain, E.CHAIN_TYPE);

  // @ts-ignore
  const dappAddressAndDenomList: string[][][] = getDappAddressAndDenomList(
    E.DAPP_ADDRESS,
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
    E.CHAIN_TYPE
  );
  if (!res) return;

  const { pools, users } = res;
  await cwUpdatePoolsAndUsers(pools, users, gasPrice);
}

initContract();
