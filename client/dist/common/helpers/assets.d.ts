import { SwapAmountInRoute } from "osmojs/types/proto/osmosis/gamm/v1beta1/tx";
interface PoolInfo {
    symbolFirst: AssetSymbol;
    symbolSecond: AssetSymbol;
    number: number;
}
declare type AssetDenom = {
    [assetSymbol in AssetSymbol]: string;
};
declare type AssetSymbol = "ATOM" | "OSMO" | "ION" | "AKT" | "DVPN" | "IRIS" | "CRO" | "XPRT" | "REGEN" | "NGM" | "EEUR" | "JUNO" | "LIKE" | "USTC" | "BCNA" | "BTSG" | "XKI" | "SCRT" | "MED" | "BOOT" | "CMDX" | "CHEQ" | "STARS" | "HUAHUA" | "LUM" | "DSM" | "GRAV" | "SOMM" | "ROWAN" | "NETA" | "UMEE" | "DEC" | "PSTAKE" | "DAI" | "USDC" | "MNTL" | "WETH" | "WBTC" | "EVMOS" | "TGD" | "DOT" | "ODIN" | "GLTO" | "GEO" | "BLD" | "CUDOS";
declare const DENOMS: AssetDenom;
declare const POOLS: PoolInfo[];
declare function getRoutes(symbolFirst: AssetSymbol, symbolSecond: AssetSymbol): SwapAmountInRoute[];
declare function getSymbolByDenom(denom: string): string;
export type { PoolInfo, AssetSymbol, AssetDenom };
export { DENOMS, POOLS, getRoutes, getSymbolByDenom };
