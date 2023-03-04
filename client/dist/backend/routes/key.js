"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.key = void 0;
const express_1 = __importDefault(require("express"));
const key_1 = require("../controllers/key");
const router = express_1.default.Router();
exports.key = router;
router.post("/set", key_1.setEncryptionKey);
