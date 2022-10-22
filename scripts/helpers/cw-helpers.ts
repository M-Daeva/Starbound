import { coin } from "@cosmjs/stargate";
import { DENOMS, AssetSymbol } from "../osmo-pools";
import { l } from "../utils";
import { getCwClient, getAddrByPrefix, fee } from "../clients";
import {
  SwapStruct,
  ClientStruct,
  User,
  PoolExtracted,
  UserExtracted,
  QueryPoolsAndUsersResponse,
  TransferParams,
} from "./interfaces";

async function getCwHelpers(
  clientStruct: ClientStruct,
  contractAddress: string
) {
  const { client, owner } = await getCwClient(clientStruct);

  async function _cwGetPools() {
    let res = await client.queryContractSmart(contractAddress, {
      get_pools: {},
    });
    // l("\n", fromBinary(res.stargate.data), "\n");
    l("\n", res, "\n");
  }

  async function _cwGetPrices() {
    let res = await client.queryContractSmart(contractAddress, {
      get_prices: {},
    });
    // l("\n", fromBinary(res.stargate.data), "\n");
    l("\n", res, "\n");
  }

  async function _cwGetBankBalance() {
    let res = await client.queryContractSmart(contractAddress, {
      get_bank_balance: {},
    });
    l("\n", res, "\n");
  }

  // async function _cwSwap(swapStruct: SwapStruct) {
  //   const { from, to, amount } = swapStruct;
  //   const res = await client.execute(
  //     owner,
  //     contractAddress,
  //     {
  //       swap_tokens: {
  //         from,
  //         to,
  //         amount: `${amount}`,
  //       },
  //     },
  //     fee
  //   );
  //   l({ attributes: res.logs[0].events[2].attributes }, "\n");
  // }

  // async function _cwTransfer(tokenAmount: number) {
  //   const receiver = getAddrByPrefix(owner, "wasm");

  //   l({ sender: owner, receiver });

  //   const tokenSymbol: AssetSymbol = "OSMO";

  //   const res = await client.execute(
  //     owner,
  //     contractAddress,
  //     {
  //       transfer: {
  //         receiver_addr: receiver,
  //         channel_id: "channel-0",
  //         token_amount: `${tokenAmount}`,
  //         token_symbol: tokenSymbol,
  //       },
  //     },
  //     fee
  //   );
  //   l({ attributes: res.logs[0].events[2].attributes }, "\n");
  // }

  async function _cwDeposit(tokenAmount: number) {
    const res = await client.execute(
      owner,
      contractAddress,
      { deposit: {} },
      fee,
      "",
      [coin(tokenAmount, DENOMS.OSMO)]
    );
    l({ attributes: res.logs[0].events[2].attributes }, "\n");
  }

  async function _cwDebugQueryPoolsAndUsers() {
    let res = await client.queryContractSmart(contractAddress, {
      debug_query_pools_and_users: {},
    });
    l("\n", res, "\n");
  }

  async function _cwQueryPoolsAndUsers() {
    let res: QueryPoolsAndUsersResponse = await client.queryContractSmart(
      contractAddress,
      {
        query_pools_and_users: {},
      }
    );
    l("\n", res, "\n");
    return res;
  }

  async function _cwDepositNew(user: User) {
    const { deposited_on_current_period, deposited_on_next_period } = user;
    let tokenAmount = +deposited_on_current_period + +deposited_on_next_period;

    const res = await client.execute(
      owner,
      contractAddress,
      { deposit: { user } },
      fee,
      "",
      [coin(tokenAmount, DENOMS.EEUR)]
    );
    l({ attributes: res.logs[0].events[2].attributes }, "\n");
  }

  async function _cwWithdrawNew(tokenAmount: number) {
    const res = await client.execute(
      owner,
      contractAddress,
      { withdraw: { amount: tokenAmount.toString() } },
      fee,
      ""
    );
    l({ attributes: res.logs[0].events[2].attributes }, "\n");
  }

  async function _cwUpdatePoolsAndUsers(
    pools: PoolExtracted[],
    users: UserExtracted[]
  ) {
    const res = await client.execute(
      owner,
      contractAddress,
      { update_pools_and_users: { pools, users } },
      fee,
      ""
    );
    l({ attributes: res.logs[0].events[2].attributes }, "\n");
  }

  async function _cwQueryAssets(address: string) {
    const res = await client.queryContractSmart(contractAddress, {
      query_assets: { address },
    });
    l("\n", res, "\n");
  }

  async function _cwSwap() {
    const res = await client.execute(
      owner,
      contractAddress,
      { swap: {} },
      fee,
      ""
    );
    l({ attributes: res.logs[0].events[2].attributes }, "\n");
  }

  async function _cwDebugQueryBank() {
    const res = await client.queryContractSmart(contractAddress, {
      debug_query_bank: {},
    });
    l("\n", res, "\n");
  }

  async function _cwTransfer() {
    const res = await client.execute(
      owner,
      contractAddress,
      { transfer: {} },
      fee,
      ""
    );
    l({ attributes: res.logs[0].events[2].attributes }, "\n");
  }

  async function _cwMultiTransfer(transferParams: TransferParams[]) {
    const res = await client.execute(
      owner,
      contractAddress,
      { multi_transfer: { params: transferParams } },
      fee,
      ""
    );
    l(res);
    l(
      res.logs[0].events[5].attributes.filter(
        (item) => item.key === "packet_data"
      ),
      "\n"
    );
  }

  return {
    owner,
    _cwGetBankBalance,
    _cwDeposit,
    _cwTransfer,
    _cwSwap,
    _cwGetPools,
    _cwGetPrices,
    _cwDebugQueryPoolsAndUsers,
    _cwQueryPoolsAndUsers,
    _cwDepositNew,
    _cwWithdrawNew,
    _cwUpdatePoolsAndUsers,
    _cwQueryAssets,
    _cwDebugQueryBank,
    _cwMultiTransfer,
  };
}

export { getCwHelpers };
