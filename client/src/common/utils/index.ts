import axios, { AxiosRequestConfig } from "axios";
import path from "path";

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

export { l, r, createRequest, rootPath, SEP, getLast, specifyTimeout };
