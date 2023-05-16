/**
* This file was automatically generated by @cosmwasm/ts-codegen@0.25.2.
* DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
* and run the @cosmwasm/ts-codegen generate command to regenerate this file.
*/

import { CosmWasmClient, SigningCosmWasmClient, ExecuteResult } from "@cosmjs/cosmwasm-stargate";
import { Coin, StdFee } from "@cosmjs/amino";
import { InstantiateMsg, ExecuteMsg, Uint128, Addr, Decimal, Timestamp, Uint64, User, Asset, PoolExtracted, UserExtracted, AssetExtracted, TransferParams, QueryMsg, MigrateMsg, QueryConfigResponse, Config, QueryLedgerResponse, Ledger, QueryPoolsAndUsersResponse, QueryUserResponse } from "./StarboundOsmosis.types";
export interface StarboundOsmosisReadOnlyInterface {
  contractAddress: string;
  queryUser: ({
    address
  }: {
    address: string;
  }) => Promise<QueryUserResponse>;
  queryPoolsAndUsers: () => Promise<QueryPoolsAndUsersResponse>;
  queryLedger: () => Promise<QueryLedgerResponse>;
  queryConfig: () => Promise<QueryConfigResponse>;
}
export class StarboundOsmosisQueryClient implements StarboundOsmosisReadOnlyInterface {
  client: CosmWasmClient;
  contractAddress: string;

  constructor(client: CosmWasmClient, contractAddress: string) {
    this.client = client;
    this.contractAddress = contractAddress;
    this.queryUser = this.queryUser.bind(this);
    this.queryPoolsAndUsers = this.queryPoolsAndUsers.bind(this);
    this.queryLedger = this.queryLedger.bind(this);
    this.queryConfig = this.queryConfig.bind(this);
  }

  queryUser = async ({
    address
  }: {
    address: string;
  }): Promise<QueryUserResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      query_user: {
        address
      }
    });
  };
  queryPoolsAndUsers = async (): Promise<QueryPoolsAndUsersResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      query_pools_and_users: {}
    });
  };
  queryLedger = async (): Promise<QueryLedgerResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      query_ledger: {}
    });
  };
  queryConfig = async (): Promise<QueryConfigResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      query_config: {}
    });
  };
}
export interface StarboundOsmosisInterface extends StarboundOsmosisReadOnlyInterface {
  contractAddress: string;
  sender: string;
  deposit: ({
    user
  }: {
    user: User;
  }, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]) => Promise<ExecuteResult>;
  withdraw: ({
    amount
  }: {
    amount: Uint128;
  }, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]) => Promise<ExecuteResult>;
  updateConfig: ({
    dappAddressAndDenomList,
    feeDefault,
    feeOsmo,
    scheduler,
    stablecoinDenom,
    stablecoinPoolId
  }: {
    dappAddressAndDenomList?: string[][][];
    feeDefault?: Decimal;
    feeOsmo?: Decimal;
    scheduler?: string;
    stablecoinDenom?: string;
    stablecoinPoolId?: number;
  }, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]) => Promise<ExecuteResult>;
  updatePoolsAndUsers: ({
    pools,
    users
  }: {
    pools: PoolExtracted[];
    users: UserExtracted[];
  }, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]) => Promise<ExecuteResult>;
  swap: (fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]) => Promise<ExecuteResult>;
  transfer: (fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]) => Promise<ExecuteResult>;
  multiTransfer: ({
    params
  }: {
    params: TransferParams[];
  }, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]) => Promise<ExecuteResult>;
}
export class StarboundOsmosisClient extends StarboundOsmosisQueryClient implements StarboundOsmosisInterface {
  client: SigningCosmWasmClient;
  sender: string;
  contractAddress: string;

  constructor(client: SigningCosmWasmClient, sender: string, contractAddress: string) {
    super(client, contractAddress);
    this.client = client;
    this.sender = sender;
    this.contractAddress = contractAddress;
    this.deposit = this.deposit.bind(this);
    this.withdraw = this.withdraw.bind(this);
    this.updateConfig = this.updateConfig.bind(this);
    this.updatePoolsAndUsers = this.updatePoolsAndUsers.bind(this);
    this.swap = this.swap.bind(this);
    this.transfer = this.transfer.bind(this);
    this.multiTransfer = this.multiTransfer.bind(this);
  }

  deposit = async ({
    user
  }: {
    user: User;
  }, fee: number | StdFee | "auto" = "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      deposit: {
        user
      }
    }, fee, memo, funds);
  };
  withdraw = async ({
    amount
  }: {
    amount: Uint128;
  }, fee: number | StdFee | "auto" = "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      withdraw: {
        amount
      }
    }, fee, memo, funds);
  };
  updateConfig = async ({
    dappAddressAndDenomList,
    feeDefault,
    feeOsmo,
    scheduler,
    stablecoinDenom,
    stablecoinPoolId
  }: {
    dappAddressAndDenomList?: string[][][];
    feeDefault?: Decimal;
    feeOsmo?: Decimal;
    scheduler?: string;
    stablecoinDenom?: string;
    stablecoinPoolId?: number;
  }, fee: number | StdFee | "auto" = "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      update_config: {
        dapp_address_and_denom_list: dappAddressAndDenomList,
        fee_default: feeDefault,
        fee_osmo: feeOsmo,
        scheduler,
        stablecoin_denom: stablecoinDenom,
        stablecoin_pool_id: stablecoinPoolId
      }
    }, fee, memo, funds);
  };
  updatePoolsAndUsers = async ({
    pools,
    users
  }: {
    pools: PoolExtracted[];
    users: UserExtracted[];
  }, fee: number | StdFee | "auto" = "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      update_pools_and_users: {
        pools,
        users
      }
    }, fee, memo, funds);
  };
  swap = async (fee: number | StdFee | "auto" = "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      swap: {}
    }, fee, memo, funds);
  };
  transfer = async (fee: number | StdFee | "auto" = "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      transfer: {}
    }, fee, memo, funds);
  };
  multiTransfer = async ({
    params
  }: {
    params: TransferParams[];
  }, fee: number | StdFee | "auto" = "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      multi_transfer: {
        params
      }
    }, fee, memo, funds);
  };
}