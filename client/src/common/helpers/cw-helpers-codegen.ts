import { coin } from "@cosmjs/stargate";
import { l } from "../utils";
import { getCwClient, getAddrByPrefix, fee } from "../signers";
import {
  ClientStruct,
  PoolExtracted,
  UserExtracted,
  QueryPoolsAndUsersResponse,
  AssetSymbol,
  TransferParams,
} from "./interfaces";
import { DENOMS } from "./assets";

import {
  StarboundClient,
  StarboundInterface,
  StarboundQueryClient,
} from "../codegen/Starbound.client";
import { User, Asset, ExecuteMsg, Coin } from "../codegen/Starbound.types";
import { StarboundMessageComposer } from "../codegen/Starbound.message-composer";

async function getCwHelpers(
  clientStruct: ClientStruct,
  contractAddress: string
) {
  const { client, owner } = await getCwClient(clientStruct);

  let composer = new StarboundMessageComposer(owner, contractAddress);
  let sClient = new StarboundClient(client, owner, contractAddress);

  async function _cwGetPools() {
    let res = await client.queryContractSmart(contractAddress, {
      get_pools: {},
    });
    l("\n", res, "\n");
  }

  async function _cwGetPrices() {
    let res = await client.queryContractSmart(contractAddress, {
      get_prices: {},
    });
    l("\n", res, "\n");
  }

  async function _cwGetBankBalance() {
    let res = await client.queryContractSmart(contractAddress, {
      get_bank_balance: {},
    });
    l("\n", res, "\n");
  }

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

  // async function _cwDebugQueryPoolsAndUsers() {
  //   let res: { pools: PoolExtracted[]; users: User[] } =
  //     await client.queryContractSmart(contractAddress, {
  //       debug_query_pools_and_users: {},
  //     });
  //   l("\n", res, "\n");
  //   return res;
  // }

  async function _cwDebugQueryPoolsAndUsers() {
    let res = await sClient.debugQueryPoolsAndUsers();
    l("\n", res, "\n");
    return res;
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

  // async function _cwDepositNew(user: User) {
  //   const { deposited_on_current_period, deposited_on_next_period } = user;
  //   let tokenAmount = +deposited_on_current_period + +deposited_on_next_period;

  //   const res = await client.execute(
  //     owner,
  //     contractAddress,
  //     composer.deposit({ user }),
  //     fee,
  //     "",
  //     [coin(tokenAmount, DENOMS.EEUR)]
  //   );
  //   const { attributes } = res.logs[0].events[2];
  //   l({ attributes }, "\n");
  //   return attributes;
  // }

  async function _cwDepositNew(user: User) {
    const { deposited_on_current_period, deposited_on_next_period } = user;
    let tokenAmount = +deposited_on_current_period + +deposited_on_next_period;

    const funds: Coin = { amount: `${tokenAmount}`, denom: DENOMS.EEUR };
    const msg = composer.deposit({ user }, [funds]);

    const tx = await client.signAndBroadcast(owner, [msg], fee);
    l(tx);
    return tx;
  }

  async function _cwWithdrawNew(tokenAmount: number) {
    const res = await client.execute(
      owner,
      contractAddress,
      { withdraw: { amount: tokenAmount.toString() } },
      fee,
      ""
    );
    const { attributes } = res.logs[0].events[2];
    l({ attributes }, "\n");
    return attributes;
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
    const res: { asset_list: Asset[] } = await client.queryContractSmart(
      contractAddress,
      {
        query_assets: { address },
      }
    );
    l("\n", res, "\n");
    return res;
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
    // l({ attributes: res.logs[0].events[2].attributes }, "\n");
    l(res, "\n");
    l(
      res.logs[0].events[5]?.attributes.filter(
        (item) => item.key === "packet_data"
      ) || "",
      "\n"
    );
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
    l(res.logs[0].events[5].attributes, "\n");
  }

  async function _cwSgSend() {
    const res = await client.execute(
      owner,
      contractAddress,
      { sg_send: {} },
      fee,
      ""
    );
    l({ attributes: res.logs[0].events[2].attributes }, "\n");
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
    _cwSgSend,
  };
}

export { getCwHelpers };
