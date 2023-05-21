import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { calculateFee as _calculateFee } from "@cosmjs/stargate";

async function getSigner(rpc: string, prefix: string, seed: string) {
  const signer = await DirectSecp256k1HdWallet.fromMnemonic(seed, { prefix });
  const owner = (await signer.getAccounts())[0].address;

  return { signer, owner, rpc };
}

export { getSigner };
