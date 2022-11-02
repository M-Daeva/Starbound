import { AxiosRequestConfig } from "axios";
declare const l: {
    (...data: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
};
declare const getAddress: (value: string) => string;
declare const createRequest: (config: Object) => {
    get: (url: string, config?: Object | undefined) => Promise<any>;
    post: (url: string, params: Object, config?: AxiosRequestConfig<any> | undefined) => Promise<any>;
    put: (url: string, params: Object, config?: AxiosRequestConfig<any> | undefined) => Promise<any>;
    patch: (url: string, params: Object, config?: AxiosRequestConfig<any> | undefined) => Promise<any>;
};
export { getAddress, l, createRequest };
