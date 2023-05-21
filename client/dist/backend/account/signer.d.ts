import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
declare function getSigner(rpc: string, prefix: string, seed: string): Promise<{
    signer: DirectSecp256k1HdWallet;
    owner: string;
    rpc: string;
}>;
export { getSigner };
