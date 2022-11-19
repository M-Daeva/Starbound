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
  getUserFunds,
  filterChainRegistry,
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

  getUserFunds: "/get-user-funds",

  filterChainRegistry: "/filter-chain-registry",
};

router.get(ROUTES.updateChainRegistry, updateChainRegistry);
router.get(ROUTES.getChainRegistry, getChainRegistry);

router.get(ROUTES.updateIbcChannels, updateIbcChannels);
router.get(ROUTES.getIbcChannels, getIbcChannnels);

router.get(ROUTES.updatePools, updatePools);
router.get(ROUTES.getPools, getPools);

router.get(ROUTES.updateValidators, updateValidators);
router.get(ROUTES.getValidators, getValidators);

router.get(ROUTES.getUserFunds, getUserFunds);

router.get(ROUTES.filterChainRegistry, filterChainRegistry);

export { router as api, ROUTES };
