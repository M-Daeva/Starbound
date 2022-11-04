import { AxiosRequestConfig } from "axios";
declare const l: {
    (...data: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
};
declare const r: (num: number, digits?: number) => number;
declare const rootPath: (dir: string) => string;
declare const SEP = "////////////////////////////////////////////////////////////////////////////////////\n";
declare const createRequest: (config: Object) => {
    get: (url: string, config?: Object) => Promise<any>;
    post: (url: string, params: Object, config?: AxiosRequestConfig) => Promise<any>;
    put: (url: string, params: Object, config?: AxiosRequestConfig) => Promise<any>;
    patch: (url: string, params: Object, config?: AxiosRequestConfig) => Promise<any>;
};
export { l, r, createRequest, rootPath, SEP };
