"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const assets_1 = require("../controllers/assets");
const router = express_1.default.Router();
router.get("/", assets_1.getHandler);
exports.default = router;
