import express from "express";
import { setEncryptionKey } from "../controllers/key";

const router = express.Router();

router.post("/set", setEncryptionKey);

export { router as key };
