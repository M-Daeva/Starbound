import { DENOMS } from "../../../common/helpers/assets";
import { init } from "../../../common/workers/testnet-frontend-workers";
import type { User, Asset } from "../../../common/codegen/Starbound.types";
import type { DelegationStruct } from "../../../common/helpers/interfaces";

const grantStakeStruct: DelegationStruct = {
  validatorAddr: "junovaloper1w8cpaaljwrytquj86kvp9s72lvmddcc208ghun",
  targetAddr: "juno18tnvnwkklyv4dyuj8x357n7vray4v4zulm2dr9",
  tokenAmount: 1_000_000_000,
  tokenDenom: "ujunox",
};

let assetListAlice: Asset[] = [
  // ATOM
  {
    asset_denom: DENOMS.ATOM,
    wallet_address: "cosmos1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyklkm75",
    wallet_balance: "0",
    weight: "0.5",
    amount_to_send_until_next_epoch: "0",
  },
  // JUNO
  {
    asset_denom: DENOMS.JUNO,
    wallet_address: "juno1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyqd4qeg",
    wallet_balance: "0",
    weight: "0.5",
    amount_to_send_until_next_epoch: "0",
  },
];

let userAlice: User = {
  asset_list: assetListAlice,
  day_counter: "3",
  deposited_on_current_period: `${1_000_000}`,
  deposited_on_next_period: "0",
  is_controlled_rebalancing: false,
};

const deposit = async (user: User) => {
  const { cwDeposit, owner } = await init();
  const tx = await cwDeposit(user);
  return { tx, owner };
};

const withdraw = async (amount: number) => {
  const { cwWithdraw, owner } = await init();
  const tx = await cwWithdraw(amount);
  return { tx, owner };
};

const grantStakeAuth = async () => {
  const { sgGrantStakeAuth, owner } = await init();
  const tx = await sgGrantStakeAuth(grantStakeStruct);
  return { tx, owner };
};

const debugQueryBank = async () => {
  const { cwDebugQueryBank, owner } = await init();
  const tx = await cwDebugQueryBank();
  return { tx, owner };
};

const queryPoolsAndUsers = async () => {
  const { cwQueryPoolsAndUsers, owner } = await init();
  const tx = await cwQueryPoolsAndUsers();
  return { tx, owner };
};

const debugQueryPoolsAndUsers = async () => {
  const { cwDebugQueryPoolsAndUsers, owner } = await init();
  const tx = await cwDebugQueryPoolsAndUsers();
  return { tx, owner };
};

const queryAssets = async (address: string) => {
  const { cwQueryAssets, owner } = await init();
  const tx = await cwQueryAssets(address);
  return { tx, owner };
};

export {
  deposit,
  withdraw,
  grantStakeAuth,
  debugQueryBank,
  queryPoolsAndUsers,
  debugQueryPoolsAndUsers,
  queryAssets,
};
