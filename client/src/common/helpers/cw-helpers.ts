import { l } from "../utils";
import { getCwClient, fee, signAndBroadcastWrapper } from "../signers";
import { ClientStruct, UpdateConfigStruct } from "./interfaces";
import { DENOMS } from "./assets";
import { MsgExecuteContractEncodeObject, Coin } from "cosmwasm";
import { StarboundOsmosisClient as StarboundClient } from "../codegen/StarboundOsmosis.client";
import { StarboundOsmosisMessageComposer as StarboundMessageComposer } from "../codegen/StarboundOsmosis.message-composer";
import {
  User,
  PoolExtracted,
  UserExtracted,
  TransferParams,
} from "../codegen/StarboundOsmosis.types";

async function getCwHelpers(
  clientStruct: ClientStruct,
  contractAddress: string
) {
  const cwClient = await getCwClient(clientStruct);
  if (!cwClient) return;

  const { client: _client, owner } = cwClient;
  const composer = new StarboundMessageComposer(owner, contractAddress);
  const client = new StarboundClient(_client, owner, contractAddress);
  const _signAndBroadcast = signAndBroadcastWrapper(_client, owner);

  async function _msgWrapper(msg: MsgExecuteContractEncodeObject) {
    const tx = await _client.signAndBroadcast(owner, [msg], fee);
    l("\n", tx, "\n");
    return tx;
  }

  async function _msgWrapperWithGasPrice(
    msg: MsgExecuteContractEncodeObject,
    gasPrice: string
  ) {
    const tx = await _signAndBroadcast([msg], gasPrice);
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
    updateConfigStruct: UpdateConfigStruct,
    gasPrice: string
  ) {
    const {
      dappAddressAndDenomList,
      feeDefault: _feeDefault,
      feeOsmo: _feeOsmo,
      scheduler,
      stablecoinDenom,
      stablecoinPoolId,
    } = updateConfigStruct;

    const feeDefault = !_feeDefault ? undefined : _feeDefault.toString();
    const feeOsmo = !_feeOsmo ? undefined : _feeOsmo.toString();

    return await _msgWrapperWithGasPrice(
      composer.updateConfig({
        dappAddressAndDenomList,
        feeDefault,
        feeOsmo,
        scheduler,
        stablecoinDenom,
        stablecoinPoolId,
      }),
      gasPrice
    );
  }

  async function cwUpdatePoolsAndUsers(
    pools: PoolExtracted[],
    users: UserExtracted[],
    gasPrice: string
  ) {
    return await _msgWrapperWithGasPrice(
      composer.updatePoolsAndUsers({ pools, users }),
      gasPrice
    );
  }

  async function cwSwap(gasPrice: string) {
    return await _msgWrapperWithGasPrice(composer.swap(), gasPrice);
  }

  async function cwTransfer(gasPrice: string) {
    return await _msgWrapperWithGasPrice(composer.transfer(), gasPrice);
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
