import { coin, GasPrice, SigningStargateClient } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { fromBech32, toBech32 } from "@cosmjs/encoding";
import { osmosis, getSigningOsmosisClient } from "osmojs";
import {
  MsgSwapExactAmountIn,
  SwapAmountInRoute,
} from "osmojs/types/proto/osmosis/gamm/v1beta1/tx";
import { Long } from "@osmonauts/helpers";
import {
  messages,
  lookupRoutesForTrade,
  prettyPool,
  OsmosisApiClient,
  calculateAmountWithSlippage,
  Trade,
  PrettyPair,
  TradeRoute,
  CoinValue,
  CoinDenom,
  CoinSymbol,
} from "@cosmology/core";
import {
  ALICE_ADDR as ALICE_ADDR_LOCAL,
  ALICE_SEED as ALICE_SEED_LOCAL,
  BOB_ADDR as BOB_ADDR_LOCAL,
  BOB_SEED as BOB_SEED_LOCAL,
  CONTRACT_ADDRESS as CONTR_ADDR_LOCAL,
  CONTRACT_CODE as CONTR_CODE_LOCAL,
} from "./chain_data.json";
import {
  CONTRACT_ADDRESS_TEST as CONTR_ADDR_TEST,
  CONTRACT_CODE_TEST as CONTR_CODE_TEST,
} from "./contract_data.json";
import {
  ALICE_ADDR as ALICE_ADDR_TEST,
  ALICE_SEED as ALICE_SEED_TEST,
  BOB_ADDR as BOB_ADDR_TEST,
  BOB_SEED as BOB_SEED_TEST,
} from "./test_wallets.json";

const {
  joinPool,
  exitPool,
  exitSwapExternAmountOut,
  exitSwapShareAmountIn,
  joinSwapExternAmountIn,
  joinSwapShareAmountOut,
  swapExactAmountIn,
  swapExactAmountOut,
} = osmosis.gamm.v1beta1.MessageComposer.withTypeUrl;

const l = console.log.bind(console);

const RPC_LOCAL = "http://localhost:26657/";
const RPC_TEST = "https://testnet-rpc.osmosis.zone/";

const PREFIX = "osmo";
const DENOM = "uosmo";

function getAddrByPrefix(addr: string, prefix: string): string {
  return toBech32(prefix, fromBech32(addr).data);
}

function getData(
  isTest: boolean // select test or local net
) {
  const SEED = {
    ALICE: isTest ? ALICE_SEED_TEST : ALICE_SEED_LOCAL,
    BOB: isTest ? BOB_SEED_TEST : BOB_SEED_LOCAL,
  };

  const ADDR = {
    ALICE: isTest ? ALICE_ADDR_TEST : ALICE_ADDR_LOCAL,
    BOB: isTest ? BOB_ADDR_TEST : BOB_ADDR_LOCAL,
  };

  const CONTR = {
    CODE_ID: isTest ? CONTR_CODE_TEST : CONTR_CODE_LOCAL,
    ADDR: isTest ? CONTR_ADDR_TEST : CONTR_ADDR_LOCAL,
  };

  const RPC = isTest ? RPC_TEST : RPC_LOCAL;

  async function getSigningClient(
    seed: string,
    isCW: boolean // select cosmwasm or cosmjs signer
  ): Promise<SigningStargateClient | SigningCosmWasmClient> {
    const prefix = PREFIX;

    const signer = await DirectSecp256k1HdWallet.fromMnemonic(seed, {
      prefix,
    });

    const signingClient = (await getSigningOsmosisClient({
      rpcEndpoint: RPC,
      signer,
    })) as unknown as SigningStargateClient;

    const cwSigningClient = await SigningCosmWasmClient.connectWithSigner(
      RPC,
      signer
    );

    return isCW ? cwSigningClient : signingClient;
  }

  async function getAliceClient(isCW: boolean) {
    return await getSigningClient(SEED.ALICE, isCW);
  }

  async function getBobClient(isCW: boolean) {
    return await getSigningClient(SEED.BOB, isCW);
  }

  return {
    getAliceClient,
    getBobClient,
    ADDR,
    CONTR,
  };
}

async function getJunoSigners() {
  const RPC_TEST = "https://rpc.uni.junomint.com:443";
  const PREFIX = "juno";

  const signerA = await DirectSecp256k1HdWallet.fromMnemonic(ALICE_SEED_TEST, {
    prefix: PREFIX,
  });

  const signerB = await DirectSecp256k1HdWallet.fromMnemonic(BOB_SEED_TEST, {
    prefix: PREFIX,
  });

  const aliceJunoClient = await SigningStargateClient.connectWithSigner(
    RPC_TEST,
    signerA,
    {
      prefix: PREFIX,
      gasPrice: GasPrice.fromString("0.1ujunox"),
    }
  );

  const bobJunoClient = await SigningStargateClient.connectWithSigner(
    RPC_TEST,
    signerB,
    {
      prefix: PREFIX,
      gasPrice: GasPrice.fromString("0.1ujunox"),
    }
  );

  return { aliceJunoClient, bobJunoClient };
}

export {
  getData,
  SigningCosmWasmClient,
  SigningStargateClient,
  getAddrByPrefix,
  getJunoSigners,
};
