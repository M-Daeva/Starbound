declare let envs: {
    SEED: {
        MAIN: string;
        USER: string;
        MY: string;
    };
    PORT: string;
    PATH: {
        TO_STATIC: string;
    };
    BASE_URL: string;
    CHAIN_TYPE: "main" | "test";
    DAPP_ADDRESS: string;
};
export default envs;
