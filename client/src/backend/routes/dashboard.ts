import express from "express";
import { getHandler } from "../controllers/dashboard";

const router = express.Router();

router.get("/", getHandler);

export default router;
