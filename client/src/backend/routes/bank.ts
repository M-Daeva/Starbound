import express from "express";
import { getHandler } from "../controllers/bank";

const router = express.Router();

router.get("/", getHandler);

export default router;
