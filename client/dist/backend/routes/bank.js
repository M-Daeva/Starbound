"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bank_1 = require("../controllers/bank");
const router = express_1.default.Router();
router.get("/", bank_1.getHandler);
exports.default = router;
