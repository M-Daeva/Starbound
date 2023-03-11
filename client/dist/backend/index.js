"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const express_1 = __importDefault(require("express"));
const utils_1 = require("../common/utils");
const body_parser_1 = require("body-parser");
const cors_1 = __importDefault(require("cors"));
const utils_2 = require("../common/utils");
const signers_1 = require("../common/signers");
const testnet_backend_workers_1 = require("../common/workers/testnet-backend-workers");
const api_1 = require("./routes/api");
const key_1 = require("./routes/key");
const key_2 = require("./middleware/key");
const testnet_config_json_1 = require("../common/config/testnet-config.json");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const h = __importStar(require("helmet"));
const api_helpers_1 = require("../common/helpers/api-helpers");
const envs_1 = require("./envs");
const baseURL = envs_1.IS_PRODUCTION ? envs_1.BASE_URL.PROD : envs_1.BASE_URL.DEV;
const req = (0, utils_1.createRequest)({ baseURL: baseURL + "/api" });
function updateTimeSensitiveStorages() {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all([
            req.get(api_1.ROUTES.updatePools),
            req.get(api_1.ROUTES.updatePoolsAndUsers),
            req.get(api_1.ROUTES.updateUserFunds),
        ]);
    });
}
function updateTimeInsensitiveStorages() {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all([
            req.get(api_1.ROUTES.updateChainRegistry),
            req.get(api_1.ROUTES.updateIbcChannels),
            req.get(api_1.ROUTES.updateValidators),
        ]);
    });
}
function triggerContract() {
    return __awaiter(this, void 0, void 0, function* () {
        const encryptionKey = (0, key_2.getEncryptionKey)();
        if (!encryptionKey)
            return;
        const seed = (0, utils_2.decrypt)(testnet_config_json_1.SEED_DAPP, encryptionKey);
        if (!seed)
            return;
        const { cwSwap, cwTransfer, cwQueryPoolsAndUsers, sgDelegateFromAll, cwUpdatePoolsAndUsers, } = yield (0, testnet_backend_workers_1.init)(seed);
        const chainRegistry = yield req.get(api_1.ROUTES.getChainRegistry);
        const chain = chainRegistry.find((item) => item.denomNative === "uosmo");
        if (!chain)
            return;
        const gasPrice = (0, signers_1.getGasPriceFromChainRegistryItem)(chain, envs_1.CHAIN_TYPE);
        const poolsStorage = yield req.get(api_1.ROUTES.getPools);
        const poolsAndUsers = yield cwQueryPoolsAndUsers();
        // const grants = await _getAllGrants(
        //   DAPP_ADDRESS,
        //   chainRegistry,
        //   CHAIN_TYPE
        // );
        // if (!grants) return;
        // l(grants[0]);
        // await sgDelegateFromAll(grants, chainRegistry, CHAIN_TYPE);
        //return;
        const res = yield (0, api_helpers_1.updatePoolsAndUsers)(chainRegistry, poolsAndUsers, poolsStorage, envs_1.CHAIN_TYPE);
        if (!res)
            return;
        const { pools, users } = res;
        yield cwUpdatePoolsAndUsers(pools, users, gasPrice);
        yield cwSwap(gasPrice);
        // TODO: check if failing of ibc transfer doesn't affect on next distribution
        // consider execution in a loop
        yield cwTransfer(gasPrice);
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            const grants = yield (0, api_helpers_1._getAllGrants)(envs_1.DAPP_ADDRESS, chainRegistry, envs_1.CHAIN_TYPE);
            if (!grants)
                return;
            (0, utils_1.l)(grants);
            yield sgDelegateFromAll(grants, chainRegistry, envs_1.CHAIN_TYPE);
        }), 15 * 60 * 1000);
    });
}
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.send("Request rate is limited"),
});
const staticHandler = express_1.default.static((0, utils_2.rootPath)("./dist/frontend"));
(0, express_1.default)()
    .disable("x-powered-by")
    .use(
// h.contentSecurityPolicy(),
h.crossOriginEmbedderPolicy({ policy: "credentialless" }), h.crossOriginOpenerPolicy(), h.crossOriginResourcePolicy(), h.dnsPrefetchControl(), h.expectCt(), h.frameguard(), h.hidePoweredBy(), h.hsts(), h.ieNoOpen(), h.noSniff(), 
// h.originAgentCluster(),
h.permittedCrossDomainPolicies(), h.referrerPolicy(), h.xssFilter(), limiter, (0, cors_1.default)(), (0, body_parser_1.text)(), (0, body_parser_1.json)())
    .use(staticHandler)
    .use("/api", api_1.api)
    .use("/key", key_1.key)
    .use("/*", staticHandler)
    .listen(envs_1.PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    (0, utils_1.l)(`Ready on port ${envs_1.PORT}`);
    // await triggerContract();
    // setInterval(triggerContract, 24 * 60 * 60 * 1000); // 24 h update period
    const periodSensitive = 15 * 1000; // 15 s update period
    const periodInsensitive = 6 * 60 * 60 * 1000; // 6 h update period
    let cnt = periodInsensitive / periodSensitive;
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        yield updateTimeSensitiveStorages();
        if (!--cnt) {
            cnt = periodInsensitive / periodSensitive;
            yield updateTimeInsensitiveStorages();
        }
    }), periodSensitive);
}));
