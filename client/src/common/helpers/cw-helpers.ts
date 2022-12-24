import { l } from "../utils";
import { getCwClient, fee } from "../signers";
import { ClientStruct } from "./interfaces";
import { DENOMS } from "./assets";
import { MsgExecuteContractEncodeObject, Coin } from "cosmwasm";
import { StarboundClient } from "../codegen/Starbound.client";
import { StarboundMessageComposer } from "../codegen/Starbound.message-composer";
import {
  User,
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
    const { deposited } = user;
    const tokenAmount = +deposited;
    const funds: Coin = { amount: `${tokenAmount}`, denom: DENOMS.EEUR };
    return await _msgWrapper(
      composer.deposit({ user }, tokenAmount ? [funds] : [])
    );
  }

  async function cwWithdraw(tokenAmount: number) {
    return await _msgWrapper(composer.withdraw({ amount: `${tokenAmount}` }));
  }

  async function cwUpdateConfig(
    scheduler?: string,
    stablecoinDenom?: string,
    stablecoinPoolId?: number,
    feeDefault?: string,
    feeOsmo?: string
  ) {
    return await _msgWrapper(
      composer.updateConfig({
        scheduler,
        stablecoinDenom,
        stablecoinPoolId,
        feeDefault,
        feeOsmo,
      })
    );
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

  async function cwQueryUser(address: string) {
    const res = await client.queryUser({ address });
    l("\n", res, "\n");
    return res;
  }

  async function cwQueryPoolsAndUsers() {
    const res = await client.queryPoolsAndUsers();
    // l("\n", res, "\n");
    return res;
  }

  async function cwQueryLedger() {
    const res = await client.queryLedger();
    l("\n", res, "\n");
    return res;
  }

  async function cwQueryConfig() {
    const res = await client.queryConfig();
    l("\n", res, "\n");
    return res;
  }

  return {
    owner,

    cwDeposit,
    cwWithdraw,
    cwUpdateConfig,

    cwUpdatePoolsAndUsers,
    cwSwap,
    cwTransfer,
    cwMultiTransfer,

    cwQueryUser,
    cwQueryPoolsAndUsers,
    cwQueryLedger,
    cwQueryConfig,
  };
}

export { getCwHelpers };
