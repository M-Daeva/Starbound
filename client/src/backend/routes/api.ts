import express from "express";
import {
  chainRegistryGetHandler,
  updateChainRegistryGetHandler,
} from "../controllers/api";

const router = express.Router();

router.get("/chain-registry", chainRegistryGetHandler);
router.get("/update-chain-registry", updateChainRegistryGetHandler);

export default router;
