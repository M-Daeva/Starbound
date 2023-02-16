/**
* This file was automatically generated by @cosmwasm/ts-codegen@0.24.0.
* DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
* and run the @cosmwasm/ts-codegen generate command to regenerate this file.
*/
import { Coin } from "@cosmjs/amino";
import { MsgExecuteContractEncodeObject } from "cosmwasm";
import { Uint128, Decimal, User, PoolExtracted, UserExtracted, TransferParams } from "./Starbound.types";
export interface StarboundMessage {
    contractAddress: string;
    sender: string;
    deposit: ({ user }: {
        user: User;
    }, funds?: Coin[]) => MsgExecuteContractEncodeObject;
    withdraw: ({ amount }: {
        amount: Uint128;
    }, funds?: Coin[]) => MsgExecuteContractEncodeObject;
    updateConfig: ({ dappAddressAndDenomList, feeDefault, feeOsmo, scheduler, stablecoinDenom, stablecoinPoolId }: {
        dappAddressAndDenomList?: string[][][];
        feeDefault?: Decimal;
        feeOsmo?: Decimal;
        scheduler?: string;
        stablecoinDenom?: string;
        stablecoinPoolId?: number;
    }, funds?: Coin[]) => MsgExecuteContractEncodeObject;
    updatePoolsAndUsers: ({ pools, users }: {
        pools: PoolExtracted[];
        users: UserExtracted[];
    }, funds?: Coin[]) => MsgExecuteContractEncodeObject;
    swap: (funds?: Coin[]) => MsgExecuteContractEncodeObject;
    transfer: (funds?: Coin[]) => MsgExecuteContractEncodeObject;
    multiTransfer: ({ params }: {
        params: TransferParams[];
    }, funds?: Coin[]) => MsgExecuteContractEncodeObject;
}
export declare class StarboundMessageComposer implements StarboundMessage {
    sender: string;
    contractAddress: string;
    constructor(sender: string, contractAddress: string);
    deposit: ({ user }: {
        user: User;
    }, funds?: Coin[]) => MsgExecuteContractEncodeObject;
    withdraw: ({ amount }: {
        amount: Uint128;
    }, funds?: Coin[]) => MsgExecuteContractEncodeObject;
    updateConfig: ({ dappAddressAndDenomList, feeDefault, feeOsmo, scheduler, stablecoinDenom, stablecoinPoolId }: {
        dappAddressAndDenomList?: string[][][] | undefined;
        feeDefault?: string | undefined;
        feeOsmo?: string | undefined;
        scheduler?: string | undefined;
        stablecoinDenom?: string | undefined;
        stablecoinPoolId?: number | undefined;
    }, funds?: Coin[]) => MsgExecuteContractEncodeObject;
    updatePoolsAndUsers: ({ pools, users }: {
        pools: PoolExtracted[];
        users: UserExtracted[];
    }, funds?: Coin[]) => MsgExecuteContractEncodeObject;
    swap: (funds?: Coin[]) => MsgExecuteContractEncodeObject;
    transfer: (funds?: Coin[]) => MsgExecuteContractEncodeObject;
    multiTransfer: ({ params }: {
        params: TransferParams[];
    }, funds?: Coin[]) => MsgExecuteContractEncodeObject;
}
