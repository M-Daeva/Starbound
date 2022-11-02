"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const timer_1 = __importDefault(require("../services/timer"));
const config_1 = __importDefault(require("../config"));
const sendRequest = () => {
    const request = (0, utils_1.createRequest)({ baseURL: config_1.default.BASE_URL });
    try {
        request.get("/");
    }
    catch (error) { }
};
const period = 9 * 60 * 1000; // 9 mins
const alarmClock = new timer_1.default(period, sendRequest);
exports.default = alarmClock;
