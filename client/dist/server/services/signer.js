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
exports.send = void 0;
const utils_1 = require("../utils");
const helpers_1 = require("../helpers");
const stargate_1 = require("@cosmjs/stargate");
function send() {
    return __awaiter(this, void 0, void 0, function* () {
        const rpc = "https://rpc.sentry-01.theta-testnet.polypore.xyz";
        const myAddr = "cosmos1j5ft99lyd36e5fyp8kh8ze7qcj00relm8q79qh";
        const signer = yield (0, helpers_1.getSignerFromMnemonic)();
        const signingClient = yield stargate_1.SigningStargateClient.connectWithSigner(rpc, signer, {
            prefix: "cosmos",
            gasPrice: stargate_1.GasPrice.fromString("0.0020uatom"), // need to request gas price
        });
        const userAddr = (yield signer.getAccounts())[0].address;
        let userBalance = yield signingClient.getAllBalances(userAddr); // use promise all
        let myBalance = yield signingClient.getAllBalances(myAddr);
        (0, utils_1.l)({ userBalance, myBalance });
        let tx = yield signingClient.signAndBroadcast(userAddr, [
            {
                typeUrl: "/cosmos.bank.v1beta1.MsgSend",
                value: {
                    fromAddress: userAddr,
                    toAddress: myAddr,
                    amount: [
                        {
                            denom: "uatom",
                            amount: "1000",
                        },
                    ],
                },
            },
        ], "auto", "from user to bank");
        // let tx = await signingClient.sendTokens(
        //   userAddr,
        //   myAddr,
        //   [
        //     {
        //       denom: "uatom",
        //       amount: "1000",
        //     },
        //   ],
        //   "auto",
        //   "from user to bank"
        // );
        userBalance = yield signingClient.getAllBalances(userAddr);
        myBalance = yield signingClient.getAllBalances(myAddr);
        (0, utils_1.l)({ userBalance, myBalance });
    });
}
exports.send = send;
