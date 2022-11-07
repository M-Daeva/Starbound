import { SwapAmountInRoute } from "osmojs/types/codegen/osmosis/gamm/v1beta1/tx";
import { AssetDenom, AssetSymbol, PoolPair } from "./interfaces";
declare const DENOMS: AssetDenom;
declare const POOLS: PoolPair[];
declare function getRoutes(symbolFirst: AssetSymbol, symbolSecond: AssetSymbol): SwapAmountInRoute[];
declare function getSymbolByDenom(denom: string): string;
export { DENOMS, POOLS, getRoutes, getSymbolByDenom };
