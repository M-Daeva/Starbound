import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { fromBech32, toBech32 } from "@cosmjs/encoding";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { SigningStargateClient, coin, StdFee } from "@cosmjs/stargate";
import { DENOMS } from "../osmo-pools";
import { ClientStruct } from "../helpers/structs";

async function getSigner(clientStruct: ClientStruct): Promise<{
  signer: DirectSecp256k1HdWallet;
  owner: string;
  RPC: string;
}> {
  const { RPC, seed, prefix } = clientStruct;
  const signer = await DirectSecp256k1HdWallet.fromMnemonic(seed, { prefix });
  const owner = (await signer.getAccounts())[0].address;
  return { signer, owner, RPC };
}

async function getSgClient(clientStruct: ClientStruct): Promise<{
  client: SigningStargateClient;
  owner: string;
}> {
  const { signer, owner, RPC } = await getSigner(clientStruct);
  const client = await SigningStargateClient.connectWithSigner(RPC, signer);
  return { client, owner };
}

async function getCwClient(clientStruct: ClientStruct): Promise<{
  client: SigningCosmWasmClient;
  owner: string;
}> {
  const { signer, owner, RPC } = await getSigner(clientStruct);
  const client = await SigningCosmWasmClient.connectWithSigner(RPC, signer);
  return { client, owner };
}

function getAddrByPrefix(address: string, prefix: string): string {
  return toBech32(prefix, fromBech32(address).data);
}

const fee: StdFee = {
  amount: [coin(0, DENOMS.OSMO)],
  gas: "250000",
};

export { getSgClient, getCwClient, getAddrByPrefix, fee };
