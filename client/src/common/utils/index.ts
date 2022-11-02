import axios, { AxiosRequestConfig } from "axios";

const l = console.log.bind(console);

const r = (num: number, digits: number = 0): number => {
  let k = 10 ** digits;
  return Math.round(k * num) / k;
};

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

export { l, r, createRequest, SEP };
