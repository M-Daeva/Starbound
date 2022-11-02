"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEP = exports.createRequest = exports.r = exports.l = void 0;
const axios_1 = __importDefault(require("axios"));
const l = console.log.bind(console);
exports.l = l;
const r = (num, digits = 0) => {
    let k = Math.pow(10, digits);
    return Math.round(k * num) / k;
};
exports.r = r;
const SEP = "////////////////////////////////////////////////////////////////////////////////////\n";
exports.SEP = SEP;
const createRequest = (config) => {
    const req = axios_1.default.create(config);
    return {
        get: (url, config) => __awaiter(void 0, void 0, void 0, function* () {
            return (yield req.get(url, config)).data;
        }),
        post: (url, params, config) => __awaiter(void 0, void 0, void 0, function* () {
            return (yield req.post(url, params, config)).data;
        }),
        put: (url, params, config) => __awaiter(void 0, void 0, void 0, function* () {
            return (yield req.put(url, params, config)).data;
        }),
        patch: (url, params, config) => __awaiter(void 0, void 0, void 0, function* () {
            return (yield req.patch(url, params, config)).data;
        }),
    };
};
exports.createRequest = createRequest;
