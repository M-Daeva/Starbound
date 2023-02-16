"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROUTES = exports.api = void 0;
const express_1 = __importDefault(require("express"));
const api_1 = require("../controllers/api");
const router = express_1.default.Router();
exports.api = router;
const ROUTES = {
    updateChainRegistry: "/update-chain-registry",
    getChainRegistry: "/get-chain-registry",
    updateIbcChannels: "/update-ibc-channels",
    getIbcChannels: "/get-ibc-channels",
    updatePools: "/update-pools",
    getPools: "/get-pools",
    updateValidators: "/update-validators",
    getValidators: "/get-validators",
    updateUserFunds: "/update-user-funds",
    getUserFunds: "/get-user-funds",
    updatePoolsAndUsers: "/update-pools-and-users",
    getPoolsAndUsers: "/get-pools-and-users",
    filterChainRegistry: "/filter-chain-registry",
    updateAll: "/update-all",
    getAll: "/get-all",
};
exports.ROUTES = ROUTES;
router.get(ROUTES.updateChainRegistry, api_1.updateChainRegistry);
router.get(ROUTES.getChainRegistry, api_1.getChainRegistry);
router.get(ROUTES.updateIbcChannels, api_1.updateIbcChannels);
router.get(ROUTES.getIbcChannels, api_1.getIbcChannnels);
router.get(ROUTES.updatePools, api_1.updatePools);
router.get(ROUTES.getPools, api_1.getPools);
router.get(ROUTES.updateValidators, api_1.updateValidators);
router.get(ROUTES.getValidators, api_1.getValidators);
router.get(ROUTES.updateUserFunds, api_1.updateUserFunds);
router.get(ROUTES.getUserFunds, api_1.getUserFunds);
router.get(ROUTES.updatePoolsAndUsers, api_1.updatePoolsAndUsers);
router.get(ROUTES.getPoolsAndUsers, api_1.getPoolsAndUsers);
router.get(ROUTES.filterChainRegistry, api_1.filterChainRegistry);
router.get(ROUTES.updateAll, api_1.updateAll);
router.get(ROUTES.getAll, api_1.getAll);
