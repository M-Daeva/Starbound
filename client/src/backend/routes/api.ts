import express from "express";
import {
  chainRegistryGetHandler,
  updateChainRegistryGetHandler,
  updateActiveNetworksInfoGetHandler,
  getActiveNetworksInfoGetHandler,
  updateValidatorsGetHandler,
  getValidatorsGetHandler,
  requestUserFundsGetHandler,
} from "../controllers/api";

const router = express.Router();

router.get("/chain-registry", chainRegistryGetHandler);
router.get("/update-chain-registry", updateChainRegistryGetHandler);
router.get("/update-active-networks-info", updateActiveNetworksInfoGetHandler);
router.get("/get-active-networks-info", getActiveNetworksInfoGetHandler);
router.get("/update-validators", updateValidatorsGetHandler);
router.get("/get-validators", getValidatorsGetHandler);
router.get("/request-user-funds", requestUserFundsGetHandler);

export default router;
