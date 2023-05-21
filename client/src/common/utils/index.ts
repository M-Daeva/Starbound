import axios, { AxiosRequestConfig, AxiosInstance } from "axios";
import path from "path";
import { SHA256, AES, enc } from "crypto-js";
import { TimeInHoursAndMins } from "../interfaces";
import { Decimal } from "decimal.js";

const l = console.log.bind(console);

function r(num: number, digits: number = 0): number {
  let k = 10 ** digits;
  return Math.round(k * num) / k;
}

function getLast<T>(arr: T[]) {
  return arr[arr.length - 1];
}

function rootPath(dir: string) {
  return path.resolve(__dirname, "../../../", dir);
}

class Request {
  private req: AxiosInstance;

  constructor(config: Object = {}) {
    this.req = axios.create(config);
  }

  async get(url: string, config?: Object) {
    return (await this.req.get(url, config)).data;
  }

  async post(url: string, params: Object, config?: AxiosRequestConfig) {
    return (await this.req.post(url, params, config)).data;
  }
}

async function specifyTimeout(
  promise: Promise<any>,
  timeout: number = 5_000,
  exception: Function = () => {
    throw new Error("Timeout!");
  }
) {
  let timer: NodeJS.Timeout;

  return Promise.race([
    promise,
    new Promise((_r, rej) => (timer = setTimeout(rej, timeout, exception))),
  ]).finally(() => clearTimeout(timer));
}

/**
 * Returns destination denom of coin/token on chain A transferred from chain A to chain B, where
 * @param channelId - id of IBC channel from chain B to chain A
 * @param srcDenom - denom of coin/token on chain A
 * @param portId - port id, 'transfer' by default
 * @returns destination denom in form of 'ibc/{hash}'
 */
function getIbcDenom(
  channelId: string,
  srcDenom: string,
  portId: string = "transfer"
): string {
  return (
    "ibc/" +
    SHA256(`${portId}/${channelId}/${srcDenom}`).toString().toUpperCase()
  );
}

/**
 * Returns id of IBC channel from chain B to chain A for coin/token
 * transferred from chain A to chain B, where
 * @param srcDenom - denom of coin/token on chain A
 * @param dstDenom - destination denom of coin/token from chain A on chain B in form of 'ibc/{hash}'
 * @param portId - port id, 'transfer' by default
 * @returns id of IBC channel from chain B to chain A
 */
function getChannelId(
  srcDenom: string,
  dstDenom: string,
  portId: string = "transfer"
): string | undefined {
  const maxChannelId = 10_000;
  const targetHash = dstDenom.split("/")[1].toLowerCase();

  for (let i = 0; i < maxChannelId; i++) {
    const channelId = `channel-${i}`;
    const hash = SHA256(`${portId}/${channelId}/${srcDenom}`).toString();

    if (hash === targetHash) return channelId;
  }
}

function encrypt(data: string, key: string): string {
  return AES.encrypt(data, key).toString();
}

function decrypt(encryptedData: string, key: string): string | undefined {
  // "Malformed UTF-8 data" workaround
  try {
    const bytes = AES.decrypt(encryptedData, key);
    return bytes.toString(enc.Utf8);
  } catch (error) {
    return;
  }
}

function _timeToMins(time: TimeInHoursAndMins): number {
  const { hours, minutes } = time;
  return 60 * hours + minutes;
}

function _minsToTime(mins: number): TimeInHoursAndMins {
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return { hours, minutes };
}

function calcTimeDelta(
  targetTime: TimeInHoursAndMins,
  period: TimeInHoursAndMins,
  ignoreRange: [TimeInHoursAndMins, TimeInHoursAndMins] | [] = []
): TimeInHoursAndMins {
  const targetTimeInMins = _timeToMins(targetTime);
  const currentTime = new Date();
  const currentTimeInMins = _timeToMins({
    hours: currentTime.getHours(),
    minutes: currentTime.getMinutes(),
  });
  const periodInMins = _timeToMins(period);

  let delta = currentTimeInMins - targetTimeInMins;
  if (delta < 0) delta += 24 * 60;

  let res = Math.ceil(delta / periodInMins) * periodInMins - delta;

  if (ignoreRange.length) {
    const [ignoreStartInMins, ignoreEndInMins] = ignoreRange.map(_timeToMins);

    if (
      currentTimeInMins + res >= ignoreStartInMins &&
      currentTimeInMins + res <= ignoreEndInMins
    ) {
      while (currentTimeInMins + res <= ignoreEndInMins) {
        res += periodInMins;
      }
    }
  }

  return _minsToTime(res);
}

// removes additional digits on display
function trimDecimal(price: string | Decimal, err: string = "0.001"): string {
  price = price.toString();
  if (!price.includes(".")) return price;

  const one = new Decimal("1");
  const target = one.sub(new Decimal(err));

  let priceNext = price;
  let ratio = one;

  while (ratio.greaterThan(target)) {
    price = price.slice(0, price.length - 1);
    priceNext = price.slice(0, price.length - 1);
    ratio = new Decimal(priceNext).div(new Decimal(price));
  }

  return price.replace(/0/g, "") === "." ? "0" : price;
}

export {
  Request,
  l,
  r,
  rootPath,
  getLast,
  specifyTimeout,
  getIbcDenom,
  getChannelId,
  encrypt,
  decrypt,
  calcTimeDelta,
  trimDecimal,
};
