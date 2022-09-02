import { writeFileSync } from "fs";

const l = console.log.bind(console);
const url = "https://api-osmosis.imperator.co/pools/v2/all?low_liquidity=false";

interface AssetDescription {
  symbol: string;
  amount: number;
  denom: string;
  coingecko_id: string;
  liquidity: number;
  liquidity_24h_change: number;
  volume_24h: number;
  volume_24h_change: number;
  volume_7d: number;
  price: number;
  fees: string;
  main: boolean;
}

type PoolDatabase = {
  [poolNumber: string]: AssetDescription[];
};

interface PoolInfoRaw {
  symbolFirst: string;
  symbolSecond: string;
  denomFirst: string;
  denomSecond: string;
  number: number;
}

async function extractPoolInfo() {
  // download pools info
  let poolDatabase: PoolDatabase = await (await fetch(url)).json();

  // skip low liquidity pools
  let valid_pools = Object.entries(poolDatabase).filter(
    ([_, [v0]]) => v0.liquidity > 100_000
  );

  // get asset symbols and save it
  let symbols = new Set<string>();
  valid_pools.forEach(([key, [v0, v1]]) => {
    if (v0.symbol.trim() !== "") symbols.add(v0.symbol);
    if (v1.symbol.trim() !== "") symbols.add(v1.symbol);
  });

  let symbols_str = "";
  symbols.forEach((item) => {
    symbols_str += `"${item}" | `;
  });

  symbols_str = symbols_str.slice(0, -3);
  writeFileSync("./symbols.txt", symbols_str);

  // get PoolInfoRaw list and save it
  let pools = valid_pools.map((item) => {
    const [key, [v0, v1]] = item;
    const poolInfo: PoolInfoRaw = {
      symbolFirst: v0.symbol,
      symbolSecond: v1.symbol,
      denomFirst: v0.denom,
      denomSecond: v1.denom,
      number: +key,
    };
    return poolInfo;
  });

  return pools;
}

function splitPoolInfo(poolsRaw: PoolInfoRaw[]) {
  let pools: {
    symbolFirst: string;
    symbolSecond: string;
    number: number;
  }[] = [];
  let denomsRaw: { [_: string]: string } = {};

  poolsRaw.forEach(
    ({ symbolFirst, symbolSecond, denomFirst, denomSecond, number }) => {
      let pool = {
        symbolFirst,
        symbolSecond,
        number,
      };
      pools.push(pool);

      denomsRaw[pool.symbolFirst] = denomFirst;
      denomsRaw[pool.symbolSecond] = denomSecond;
    }
  );

  writeFileSync("./pools.json", JSON.stringify(pools));
  writeFileSync("./denom.json", JSON.stringify(denomsRaw));
}

async function main() {
  let poolsRaw = await extractPoolInfo();
  splitPoolInfo(poolsRaw);
}

main();
