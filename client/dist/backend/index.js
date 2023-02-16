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
const express_1 = __importDefault(require("express"));
const utils_1 = require("../common/utils");
const body_parser_1 = require("body-parser");
const cors_1 = __importDefault(require("cors"));
const config_1 = __importDefault(require("./config"));
const utils_2 = require("../common/utils");
const signers_1 = require("../common/signers");
const testnet_backend_workers_1 = require("../common/workers/testnet-backend-workers");
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const assets_1 = __importDefault(require("./routes/assets"));
const bank_1 = __importDefault(require("./routes/bank"));
const api_1 = require("./routes/api");
const api_helpers_1 = require("../common/helpers/api-helpers");
let req = (0, utils_1.createRequest)({ baseURL: config_1.default.BASE_URL + "/api" });
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
        const { cwSwap, cwTransfer, cwQueryPoolsAndUsers, sgDelegateFromAll, cwUpdatePoolsAndUsers, } = yield (0, testnet_backend_workers_1.init)();
        const chainRegistry = yield req.get(api_1.ROUTES.getChainRegistry);
        const chain = chainRegistry.find((item) => item.denomNative === "uosmo");
        if (!chain)
            return;
        const gasPrice = (0, signers_1.getGasPriceFromChainRegistryItem)(chain, config_1.default.CHAIN_TYPE);
        const poolsStorage = yield req.get(api_1.ROUTES.getPools);
        const poolsAndUsers = yield cwQueryPoolsAndUsers();
        // const grants = await _getAllGrants(
        //   E.DAPP_ADDRESS,
        //   chainRegistry,
        //   E.CHAIN_TYPE
        // );
        // if (!grants) return;
        // l(grants[0]);
        // await sgDelegateFromAll(grants, chainRegistry, E.CHAIN_TYPE);
        //return;
        const res = yield (0, api_helpers_1.updatePoolsAndUsers)(chainRegistry, poolsAndUsers, poolsStorage, config_1.default.CHAIN_TYPE);
        if (!res)
            return;
        const { pools, users } = res;
        yield cwUpdatePoolsAndUsers(pools, users, gasPrice);
        yield cwSwap(gasPrice);
        // TODO: check if failing of ibc transfer doesn't affect on next distribution
        // consider execution in a loop
        yield cwTransfer(gasPrice);
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            const grants = yield (0, api_helpers_1._getAllGrants)(config_1.default.DAPP_ADDRESS, chainRegistry, config_1.default.CHAIN_TYPE);
            if (!grants)
                return;
            (0, utils_1.l)(grants);
            yield sgDelegateFromAll(grants, chainRegistry, config_1.default.CHAIN_TYPE);
        }), 15 * 60 * 1000);
    });
}
function initStorages() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const t = Date.now();
            const res = yield req.get(api_1.ROUTES.updateAll);
            const delta = (Date.now() - t) / 1e3;
            const minutes = Math.floor(delta / 60);
            const seconds = Math.floor(delta % 60);
            (0, utils_1.l)("\n", res, "\n");
            (0, utils_1.l)("\n", `${minutes} minutes ${seconds} seconds`, "\n");
        }
        catch (error) {
            (0, utils_1.l)(error);
        }
    });
}
function initContract() {
    return __awaiter(this, void 0, void 0, function* () {
        const { cwQueryPoolsAndUsers, cwUpdatePoolsAndUsers, cwUpdateConfig } = yield (0, testnet_backend_workers_1.init)();
        // add dapp addresses
        const poolsStorage = yield req.get(api_1.ROUTES.getPools);
        const chainRegistry = yield req.get(api_1.ROUTES.getChainRegistry);
        const chain = chainRegistry.find((item) => item.denomNative === "uosmo");
        if (!chain)
            return;
        const gasPrice = (0, signers_1.getGasPriceFromChainRegistryItem)(chain, config_1.default.CHAIN_TYPE);
        // @ts-ignore
        const dappAddressAndDenomList = (0, api_helpers_1.getDappAddressAndDenomList)(config_1.default.DAPP_ADDRESS, chainRegistry);
        yield cwUpdateConfig({
            dappAddressAndDenomList,
        }, gasPrice);
        // add pools
        const poolsAndUsers = yield cwQueryPoolsAndUsers();
        const res = yield (0, api_helpers_1.updatePoolsAndUsers)(chainRegistry, poolsAndUsers, poolsStorage, config_1.default.CHAIN_TYPE);
        if (!res)
            return;
        const { pools, users } = res;
        yield cwUpdatePoolsAndUsers(pools, users, gasPrice);
    });
}
function initAll() {
    return __awaiter(this, void 0, void 0, function* () {
        yield initStorages();
        yield initContract();
    });
}
(0, express_1.default)()
    .use((0, cors_1.default)(), (0, body_parser_1.text)(), (0, body_parser_1.json)())
    .use(express_1.default.static((0, utils_2.rootPath)("./dist/frontend")))
    .use("/dashboard", dashboard_1.default)
    .use("/assets", assets_1.default)
    .use("/bank", bank_1.default)
    .use("/api", api_1.api)
    .listen(config_1.default.PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    (0, utils_1.l)(`Ready on port ${config_1.default.PORT}`);
    // await initAll();
    // await initContract();
    // await initStorages();
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
