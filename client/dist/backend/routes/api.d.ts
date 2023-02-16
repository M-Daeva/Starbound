declare const router: import("express-serve-static-core").Router;
declare const ROUTES: {
    updateChainRegistry: string;
    getChainRegistry: string;
    updateIbcChannels: string;
    getIbcChannels: string;
    updatePools: string;
    getPools: string;
    updateValidators: string;
    getValidators: string;
    updateUserFunds: string;
    getUserFunds: string;
    updatePoolsAndUsers: string;
    getPoolsAndUsers: string;
    filterChainRegistry: string;
    updateAll: string;
    getAll: string;
};
export { router as api, ROUTES };
