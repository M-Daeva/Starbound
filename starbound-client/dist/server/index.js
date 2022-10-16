"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const utils_1 = require("./utils");
const body_parser_1 = require("body-parser");
const cors_1 = __importDefault(require("cors"));
const config_1 = __importDefault(require("./config"));
const test_1 = __importDefault(require("./routes/test"));
const helpers_1 = require("./helpers");
const alarm_clock_1 = __importDefault(require("./middleware/alarm-clock"));
(0, express_1.default)()
    .use((0, cors_1.default)(), (0, body_parser_1.text)(), (0, body_parser_1.json)())
    .use(express_1.default.static((0, helpers_1.rootPath)("./dist/client")))
    .use("/test", test_1.default)
    .listen(config_1.default.PORT, () => {
    (0, utils_1.l)(`Ready on port ${config_1.default.PORT}`);
    alarm_clock_1.default.start(); // Heroku alarm clock
});
