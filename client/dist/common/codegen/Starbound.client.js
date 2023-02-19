"use strict";
/**
* This file was automatically generated by @cosmwasm/ts-codegen@0.24.0.
* DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
* and run the @cosmwasm/ts-codegen generate command to regenerate this file.
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StarboundClient = exports.StarboundQueryClient = void 0;
class StarboundQueryClient {
    constructor(client, contractAddress) {
        this.queryUser = ({ address }) => __awaiter(this, void 0, void 0, function* () {
            return this.client.queryContractSmart(this.contractAddress, {
                query_user: {
                    address
                }
            });
        });
        this.queryPoolsAndUsers = () => __awaiter(this, void 0, void 0, function* () {
            return this.client.queryContractSmart(this.contractAddress, {
                query_pools_and_users: {}
            });
        });
        this.queryLedger = () => __awaiter(this, void 0, void 0, function* () {
            return this.client.queryContractSmart(this.contractAddress, {
                query_ledger: {}
            });
        });
        this.queryConfig = () => __awaiter(this, void 0, void 0, function* () {
            return this.client.queryContractSmart(this.contractAddress, {
                query_config: {}
            });
        });
        this.client = client;
        this.contractAddress = contractAddress;
        this.queryUser = this.queryUser.bind(this);
        this.queryPoolsAndUsers = this.queryPoolsAndUsers.bind(this);
        this.queryLedger = this.queryLedger.bind(this);
        this.queryConfig = this.queryConfig.bind(this);
    }
}
exports.StarboundQueryClient = StarboundQueryClient;
class StarboundClient extends StarboundQueryClient {
    constructor(client, sender, contractAddress) {
        super(client, contractAddress);
        this.deposit = ({ user }, fee = "auto", memo, funds) => __awaiter(this, void 0, void 0, function* () {
            return yield this.client.execute(this.sender, this.contractAddress, {
                deposit: {
                    user
                }
            }, fee, memo, funds);
        });
        this.withdraw = ({ amount }, fee = "auto", memo, funds) => __awaiter(this, void 0, void 0, function* () {
            return yield this.client.execute(this.sender, this.contractAddress, {
                withdraw: {
                    amount
                }
            }, fee, memo, funds);
        });
        this.updateConfig = ({ dappAddressAndDenomList, feeDefault, feeOsmo, scheduler, stablecoinDenom, stablecoinPoolId }, fee = "auto", memo, funds) => __awaiter(this, void 0, void 0, function* () {
            return yield this.client.execute(this.sender, this.contractAddress, {
                update_config: {
                    dapp_address_and_denom_list: dappAddressAndDenomList,
                    fee_default: feeDefault,
                    fee_osmo: feeOsmo,
                    scheduler,
                    stablecoin_denom: stablecoinDenom,
                    stablecoin_pool_id: stablecoinPoolId
                }
            }, fee, memo, funds);
        });
        this.updatePoolsAndUsers = ({ pools, users }, fee = "auto", memo, funds) => __awaiter(this, void 0, void 0, function* () {
            return yield this.client.execute(this.sender, this.contractAddress, {
                update_pools_and_users: {
                    pools,
                    users
                }
            }, fee, memo, funds);
        });
        this.swap = (fee = "auto", memo, funds) => __awaiter(this, void 0, void 0, function* () {
            return yield this.client.execute(this.sender, this.contractAddress, {
                swap: {}
            }, fee, memo, funds);
        });
        this.transfer = (fee = "auto", memo, funds) => __awaiter(this, void 0, void 0, function* () {
            return yield this.client.execute(this.sender, this.contractAddress, {
                transfer: {}
            }, fee, memo, funds);
        });
        this.multiTransfer = ({ params }, fee = "auto", memo, funds) => __awaiter(this, void 0, void 0, function* () {
            return yield this.client.execute(this.sender, this.contractAddress, {
                multi_transfer: {
                    params
                }
            }, fee, memo, funds);
        });
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
}
exports.StarboundClient = StarboundClient;