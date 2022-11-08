import express from "express";
import { getHandler } from "../controllers/assets";

const router = express.Router();

router.get("/", getHandler);

export default router;
