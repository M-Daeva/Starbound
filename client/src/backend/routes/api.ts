import express from "express";
import {
  updateChainRegistry,
  getChainRegistry,
  updateIbcChannels,
  getIbcChannnels,
  updatePools,
  getPools,
  updateValidators,
  getValidators,
  updateUserFunds,
  getUserFunds,
  updatePoolsAndUsers,
  getPoolsAndUsers,
  filterChainRegistry,
  updateAll,
  getAll,
} from "../controllers/api";

const router = express.Router();

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

router.get(ROUTES.updateChainRegistry, updateChainRegistry);
router.get(ROUTES.getChainRegistry, getChainRegistry);

router.get(ROUTES.updateIbcChannels, updateIbcChannels);
router.get(ROUTES.getIbcChannels, getIbcChannnels);

router.get(ROUTES.updatePools, updatePools);
router.get(ROUTES.getPools, getPools);

router.get(ROUTES.updateValidators, updateValidators);
router.get(ROUTES.getValidators, getValidators);

router.get(ROUTES.updateUserFunds, updateUserFunds);
router.get(ROUTES.getUserFunds, getUserFunds);

router.get(ROUTES.updatePoolsAndUsers, updatePoolsAndUsers);
router.get(ROUTES.getPoolsAndUsers, getPoolsAndUsers);

router.get(ROUTES.filterChainRegistry, filterChainRegistry);

router.get(ROUTES.updateAll, updateAll);
router.get(ROUTES.getAll, getAll);

export { router as api, ROUTES };
