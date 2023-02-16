"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHandler = void 0;
const assets_1 = require("../middleware/assets");
const getHandler = (_req, res) => {
    res.send((0, assets_1.getData)());
};
exports.getHandler = getHandler;
