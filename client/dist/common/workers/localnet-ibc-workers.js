"use strict";
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
exports.init = void 0;
const utils_1 = require("../utils");
const cw_helpers_1 = require("../helpers/cw-helpers");
const sg_helpers_1 = require("../helpers/sg-helpers");
const assets_1 = require("../helpers/assets");
const localnet_ibc_config_json_1 = require("../config/localnet-ibc-config.json");
const aliceClientStruct = {
    prefix: localnet_ibc_config_json_1.PREFIX,
    RPC: localnet_ibc_config_json_1.RPC,
    seed: localnet_ibc_config_json_1.SEED_ALICE,
};
const fromOsmotoWasmWbaTestnet = {
    dstPrefix: "wasm",
    sourceChannel: "channel-0",
    sourcePort: "transfer",
    amount: 123,
};
const fromOsmoToAtom = {
    from: "OSMO",
    to: "ATOM",
    amount: 1000,
};
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        // alice cosmwasm helpers
        const aliceCwHelpers = yield (0, cw_helpers_1.getCwHelpers)(aliceClientStruct, localnet_ibc_config_json_1.CONTRACT_ADDRESS);
        if (!aliceCwHelpers)
            return;
        const { cwDeposit: _cwDeposit, cwMultiTransfer: _cwMultiTransfer } = aliceCwHelpers;
        // alice stargate helpers
        const aliceSgHelpers = yield (0, sg_helpers_1.getSgHelpers)(aliceClientStruct);
        if (!aliceSgHelpers)
            return;
        const { sgGetTokenBalances: _sgGetTokenBalances, sgSwap: _sgSwap, sgTransfer: _sgTransfer, } = aliceSgHelpers;
        function sgTransfer() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)(utils_1.SEP, "sending ibc transfer...");
                try {
                    const tx = yield _sgTransfer(fromOsmotoWasmWbaTestnet);
                    (0, utils_1.l)(tx, "\n");
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function sgSwap() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)(utils_1.SEP, "executing swap...");
                try {
                    const tx = yield _sgSwap(fromOsmoToAtom);
                    (0, utils_1.l)(tx, "\n");
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function _queryBalance() {
            return __awaiter(this, void 0, void 0, function* () {
                let balances = yield _sgGetTokenBalances(localnet_ibc_config_json_1.CONTRACT_ADDRESS);
                (0, utils_1.l)({ contract: balances });
            });
        }
        let assetListAlice = [
            // ATOM
            {
                asset_denom: assets_1.DENOMS.ATOM,
                wallet_address: "cosmos1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyklkm75",
                wallet_balance: "0",
                weight: "0.5",
                amount_to_send_until_next_epoch: "0",
            },
            // JUNO
            {
                asset_denom: assets_1.DENOMS.JUNO,
                wallet_address: "juno1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyqd4qeg",
                wallet_balance: "0",
                weight: "0.5",
                amount_to_send_until_next_epoch: "0",
            },
        ];
        let userAlice = {
            asset_list: assetListAlice,
            day_counter: "3",
            deposited: `${100}`,
            is_controlled_rebalancing: false,
        };
        function cwDeposit() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)(utils_1.SEP, "depositing...");
                try {
                    yield _cwDeposit(userAlice);
                    yield _queryBalance();
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        // async function cwTransfer() {
        //   l(SEP, "sending ibc transfer...");
        //   try {
        //     await _cwTransfer(1_000);
        //     await _queryBalance();
        //   } catch (error) {
        //     l(error, "\n");
        //   }
        // }
        // const swapStruct: SwapStruct = {
        //   from: "OSMO",
        //   to: "ATOM",
        //   amount: 1_000,
        // };
        // async function cwSwap() {
        //   l(SEP, "executing swap...");
        //   try {
        //     await _cwSwap(swapStruct);
        //     await _queryBalance();
        //   } catch (error) {
        //     l(error, "\n");
        //   }
        // }
        const wasmChannel = "channel-0";
        const wasmAddr = "wasm1chgwz55h9kepjq0fkj5supl2ta3nwu63mk04cl";
        const wasmRevision = "5";
        const wasmHeight = "500000";
        let osmoAmount = "1";
        // let timeout_in_mins = 5;
        // let timestamp = `${Date.now() + timeout_in_mins * 60 * 1000}000000`;
        let timestamp = "0";
        let tokenParams = {
            channel_id: wasmChannel,
            to: wasmAddr,
            amount: osmoAmount,
            denom: assets_1.DENOMS.OSMO,
            block_revision: wasmRevision,
            block_height: wasmHeight,
            timestamp,
        };
        let tokenParams2 = {
            channel_id: wasmChannel,
            to: wasmAddr,
            amount: "2",
            denom: assets_1.DENOMS.OSMO,
            block_revision: wasmRevision,
            block_height: wasmHeight,
            timestamp,
        };
        let params = [tokenParams, tokenParams2];
        function cwMultiTransfer() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)("cwMultiTransfer");
                try {
                    yield _cwMultiTransfer(params);
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        return {
            sgTransfer,
            sgSwap,
            cwDeposit,
            cwMultiTransfer,
        };
    });
}
exports.init = init;
