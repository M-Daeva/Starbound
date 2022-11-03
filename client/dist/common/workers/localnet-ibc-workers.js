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
const interfaces_1 = require("../helpers/interfaces");
const ibc_network_config_json_1 = require("../config/ibc-network-config.json");
const clientStruct = {
    isKeplrType: false,
    prefix: ibc_network_config_json_1.PREFIX,
    RPC: ibc_network_config_json_1.RPC,
    seed: ibc_network_config_json_1.SEED_ALICE,
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
        const { _sgDelegateFrom, _sgGetTokenBalances, _sgGrantStakeAuth, _sgSwap, _sgTransfer, } = yield (0, sg_helpers_1.getSgHelpers)(clientStruct);
        const { _cwDeposit, _cwGetBankBalance, _cwSwap, _cwTransfer, _cwMultiTransfer, } = yield (0, cw_helpers_1.getCwHelpers)(clientStruct, ibc_network_config_json_1.CONTRACT_ADDRESS);
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
                let balances = yield _sgGetTokenBalances(ibc_network_config_json_1.CONTRACT_ADDRESS);
                (0, utils_1.l)({ contract: balances });
            });
        }
        function cwDeposit() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)(utils_1.SEP, "depositing...");
                try {
                    yield _cwDeposit(10000);
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
        let tokenParams = {
            channel_id: wasmChannel,
            to: wasmAddr,
            amount: osmoAmount,
            denom: interfaces_1.DENOMS.OSMO,
            block_revision: wasmRevision,
            block_height: wasmHeight,
        };
        let tokenParams2 = {
            channel_id: wasmChannel,
            to: wasmAddr,
            amount: "2",
            denom: interfaces_1.DENOMS.OSMO,
            block_revision: wasmRevision,
            block_height: wasmHeight,
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
            _queryBalance,
            cwDeposit,
            //  cwTransfer, cwSwap
            cwMultiTransfer,
        };
    });
}
exports.init = init;
