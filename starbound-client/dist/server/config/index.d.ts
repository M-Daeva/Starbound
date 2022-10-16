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
    HEROKU: {
        VARS_URL: string;
        AUTH_KEY: string;
    };
    BASE_URL: string;
};
export default envs;
