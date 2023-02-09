import axios, { AxiosRequestConfig } from "axios";
import path from "path";
import { SHA256, AES, enc } from "crypto-js";

const l = console.log.bind(console);

const r = (num: number, digits: number = 0): number => {
  let k = 10 ** digits;
  return Math.round(k * num) / k;
};

function getLast<T>(arr: T[]) {
  return arr[arr.length - 1];
}

const rootPath = (dir: string) => path.resolve(__dirname, "../../../", dir);

const SEP =
  "////////////////////////////////////////////////////////////////////////////////////\n";

const createRequest = (config: Object) => {
  const req = axios.create(config);

  return {
    get: async (url: string, config?: Object) => {
      return (await req.get(url, config)).data;
    },
    post: async (url: string, params: Object, config?: AxiosRequestConfig) => {
      return (await req.post(url, params, config)).data;
    },
    put: async (url: string, params: Object, config?: AxiosRequestConfig) => {
      return (await req.put(url, params, config)).data;
    },
    patch: async (url: string, params: Object, config?: AxiosRequestConfig) => {
      return (await req.patch(url, params, config)).data;
    },
  };
};

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
 * Returns IBC denom of native asset of chain B transferred from chain B to chain A, where
 * @param channelId - channel id on chain A
 * @param nativeDenom - native denom on chain B
 * @param portId - port id, 'transfer' by default
 * @returns IBC denom in form of 'ibc/{hash}'
 */
function getIbcDenom(
  channelId: string,
  nativeDenom: string,
  portId: string = "transfer"
): string {
  return (
    "ibc/" +
    SHA256(`${portId}/${channelId}/${nativeDenom}`).toString().toUpperCase()
  );
}

/**
 * Returns channel id on chain A for asset transferred from chain B to chain A, where
 * @param nativeDenom - native denom on chain B
 * @param ibcDenom - IBC denom of asset from chain B on chain A in form of 'ibc/{hash}'
 * @param portId - port id, 'transfer' by default
 * @returns channel id on chain A
 */
function getChannelId(
  nativeDenom: string,
  ibcDenom: string,
  portId: string = "transfer"
): string | undefined {
  const maxChannelId = 10_000;
  const targetHash = ibcDenom.split("/")[1].toLowerCase();

  for (let i = 0; i < maxChannelId; i++) {
    const channelId = `channel-${i}`;
    const hash = SHA256(`${portId}/${channelId}/${nativeDenom}`).toString();

    if (hash === targetHash) return channelId;
  }
}

function encode(data: string, key: string): string {
  return AES.encrypt(data, key).toString();
}

function decode(encodedData: string, key: string): string {
  const bytes = AES.decrypt(encodedData, key);
  return bytes.toString(enc.Utf8);
}

export {
  l,
  r,
  createRequest,
  rootPath,
  SEP,
  getLast,
  specifyTimeout,
  getIbcDenom,
  getChannelId,
  encode,
  decode,
};
