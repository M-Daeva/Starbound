import { l } from "../utils";
import { getCwClient, fee } from "../signers";
import { ClientStruct } from "./interfaces";
import { DENOMS } from "./assets";
import { MsgExecuteContractEncodeObject } from "cosmwasm";
import { StarboundClient } from "../codegen/Starbound.client";
import { StarboundMessageComposer } from "../codegen/Starbound.message-composer";
import {
  User,
  Coin,
  PoolExtracted,
  UserExtracted,
  TransferParams,
} from "../codegen/Starbound.types";

async function getCwHelpers(
  clientStruct: ClientStruct,
  contractAddress: string
) {
  const { client: _client, owner } = await getCwClient(clientStruct);
  const composer = new StarboundMessageComposer(owner, contractAddress);
  const client = new StarboundClient(_client, owner, contractAddress);

  async function _msgWrapper(msg: MsgExecuteContractEncodeObject) {
    const tx = await _client.signAndBroadcast(owner, [msg], fee);
    l("\n", tx, "\n");
    return tx;
  }

  async function cwDeposit(user: User) {
    const { deposited_on_current_period, deposited_on_next_period } = user;
    const tokenAmount =
      +deposited_on_current_period + +deposited_on_next_period;
    const funds: Coin = { amount: `${tokenAmount}`, denom: DENOMS.EEUR };
    return await _msgWrapper(composer.deposit({ user }, [funds]));
  }

  async function cwWithdraw(tokenAmount: number) {
    return await _msgWrapper(composer.withdraw({ amount: `${tokenAmount}` }));
  }

  async function cwUpdateScheduler(address: string) {
    return await _msgWrapper(composer.updateScheduler({ address }));
  }

  async function cwUpdatePoolsAndUsers(
    pools: PoolExtracted[],
    users: UserExtracted[]
  ) {
    return await _msgWrapper(composer.updatePoolsAndUsers({ pools, users }));
  }

  async function cwSwap() {
    return await _msgWrapper(composer.swap());
  }

  async function cwTransfer() {
    return await _msgWrapper(composer.transfer());
  }

  async function cwMultiTransfer(params: TransferParams[]) {
    return await _msgWrapper(composer.multiTransfer({ params }));
  }

  async function cwQueryAssets(address: string) {
    const res = await client.queryAssets({ address });
    l("\n", res, "\n");
    return res;
  }

  async function cwQueryPoolsAndUsers() {
    const res = await client.queryPoolsAndUsers();
    // l("\n", res, "\n");
    return res;
  }

  async function cwDebugQueryPoolsAndUsers() {
    const res = await client.debugQueryPoolsAndUsers();
    l("\n", res, "\n");
    return res;
  }

  async function cwDebugQueryBank() {
    const res = await client.debugQueryBank();
    l("\n", res, "\n");
    return res;
  }

  return {
    owner,

    cwDeposit,
    cwWithdraw,
    cwUpdateScheduler,

    cwUpdatePoolsAndUsers,
    cwSwap,
    cwTransfer,
    cwMultiTransfer,

    cwQueryAssets,
    cwQueryPoolsAndUsers,
    cwDebugQueryPoolsAndUsers,
    cwDebugQueryBank,
  };
}

export { getCwHelpers };
