"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHandler = void 0;
const test_1 = require("../middleware/test");
const getHandler = (_req, res) => {
    res.send((0, test_1.checkMainBalance)());
};
exports.getHandler = getHandler;
