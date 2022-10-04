import { AssetSymbol } from "../osmo-pools";

interface ClientStruct {
  RPC: string;
  seed: string;
  prefix: string;
}

interface IbcStruct {
  dstPrefix: string;
  sourceChannel: string;
  sourcePort: string;
  amount: number;
}

interface SwapStruct {
  from: AssetSymbol;
  to: AssetSymbol;
  amount: number;
}

interface DelegationStruct {
  targetAddr: string;
  tokenAmount: number;
  tokenDenom: string;
  validatorAddr: string;
}

export { ClientStruct, DelegationStruct, IbcStruct, SwapStruct };
