import { l } from "../utils";
import { getCwClient, fee, signAndBroadcastWrapper } from "./clients";
import { UpdateConfigStruct } from "../interfaces";
import { Coin } from "@cosmjs/stargate";
import {
  SigningCosmWasmClient,
  CosmWasmClient,
  MsgExecuteContractEncodeObject,
} from "@cosmjs/cosmwasm-stargate";
import { StarboundOsmosisMessageComposer } from "../codegen/StarboundOsmosis.message-composer";
import { StarboundOsmosisQueryClient } from "../codegen/StarboundOsmosis.client";
import {
  DirectSecp256k1HdWallet,
  OfflineSigner,
  OfflineDirectSigner,
} from "@cosmjs/proto-signing";
import {
  User,
  PoolExtracted,
  UserExtracted,
  TransferParams,
} from "../codegen/StarboundOsmosis.types";

async function getCwExecHelpers(
  contractAddress: string,
  rpc: string,
  owner: string,
  signer: (OfflineSigner & OfflineDirectSigner) | DirectSecp256k1HdWallet
) {
  const cwClient = await getCwClient(rpc, owner, signer);
  if (!cwClient) return;

  const signingClient = cwClient.client as SigningCosmWasmClient;
  const msgComposer = new StarboundOsmosisMessageComposer(
    owner,
    contractAddress
  );
  const _signAndBroadcast = signAndBroadcastWrapper(signingClient, owner);

  async function _msgWrapper(msg: MsgExecuteContractEncodeObject) {
    const tx = await signingClient.signAndBroadcast(owner, [msg], fee);
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
    const EEUR_DENOM =
      "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F";
    const { deposited } = user;
    const tokenAmount = +deposited;
    const funds: Coin = {
      amount: `${tokenAmount}`,
      denom: EEUR_DENOM,
    };
    return await _msgWrapper(
      msgComposer.deposit({ user }, tokenAmount ? [funds] : [])
    );
  }

  async function cwWithdraw(tokenAmount: number) {
    return await _msgWrapper(
      msgComposer.withdraw({ amount: `${tokenAmount}` })
    );
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
      msgComposer.updateConfig({
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
      msgComposer.updatePoolsAndUsers({ pools, users }),
      gasPrice
    );
  }

  async function cwSwap(gasPrice: string) {
    return await _msgWrapperWithGasPrice(msgComposer.swap(), gasPrice);
  }

  async function cwTransfer(gasPrice: string) {
    return await _msgWrapperWithGasPrice(msgComposer.transfer(), gasPrice);
  }

  async function cwMultiTransfer(params: TransferParams[]) {
    return await _msgWrapper(msgComposer.multiTransfer({ params }));
  }

  return {
    cwDeposit,
    cwWithdraw,
    cwUpdateConfig,

    cwUpdatePoolsAndUsers,
    cwSwap,
    cwTransfer,
    cwMultiTransfer,
  };
}

async function getCwQueryHelpers(contractAddress: string, rpc: string) {
  const cwClient = await getCwClient(rpc);
  if (!cwClient) return;

  const cosmwasmQueryClient: CosmWasmClient = cwClient.client;
  const queryClient = new StarboundOsmosisQueryClient(
    cosmwasmQueryClient,
    contractAddress
  );

  async function cwQueryUser(address: string) {
    const res = await queryClient.queryUser({ address });
    l("\n", res, "\n");
    return res;
  }

  async function cwQueryPoolsAndUsers() {
    const res = await queryClient.queryPoolsAndUsers();
    // l("\n", res, "\n");
    return res;
  }

  async function cwQueryLedger() {
    const res = await queryClient.queryLedger();
    l("\n", res, "\n");
    return res;
  }

  async function cwQueryConfig() {
    const res = await queryClient.queryConfig();
    l("\n", res, "\n");
    return res;
  }

  return {
    cwQueryUser,
    cwQueryPoolsAndUsers,
    cwQueryLedger,
    cwQueryConfig,
  };
}

export { getCwExecHelpers, getCwQueryHelpers };
