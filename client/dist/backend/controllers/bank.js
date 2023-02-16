"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHandler = void 0;
const bank_1 = require("../middleware/bank");
const getHandler = (_req, res) => {
    res.send((0, bank_1.getData)());
};
exports.getHandler = getHandler;
