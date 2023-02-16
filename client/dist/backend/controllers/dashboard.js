"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHandler = void 0;
const dashboard_1 = require("../middleware/dashboard");
const getHandler = (_req, res) => {
    res.send((0, dashboard_1.getData)());
};
exports.getHandler = getHandler;
