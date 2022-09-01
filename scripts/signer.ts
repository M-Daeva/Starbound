import { GasPrice, SigningStargateClient } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { fromBech32, toBech32 } from "@cosmjs/encoding";
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

const RPC_LOCAL = "http://localhost:26657/";
const RPC_TEST = "https://testnet-rpc.osmosis.zone/";

const PREFIX = "osmo";
const DENOM = "uosmo";

async function getAddrBySeed(seed: string, prefix: string): Promise<string> {
  const signer = await DirectSecp256k1HdWallet.fromMnemonic(seed, {
    prefix,
  });

  return (await signer.getAccounts())[0].address;
}

function getAddrByAddr(addr: string, prefix: string): string {
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

    const signingClient = await SigningStargateClient.connectWithSigner(
      RPC,
      signer,
      {
        prefix,
        gasPrice: GasPrice.fromString(`0.1${DENOM}`),
      }
    );

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

export {
  getData,
  SigningCosmWasmClient,
  SigningStargateClient,
  getAddrByAddr,
  getAddrBySeed,
};
