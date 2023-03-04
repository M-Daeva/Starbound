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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setEncryptionKey = void 0;
const key_1 = require("../middleware/key");
function setEncryptionKey(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { encryptionKey } = req.body;
        if (!encryptionKey)
            return;
        const data = yield (0, key_1.setEncryptionKey)(encryptionKey);
        res.send(data);
    });
}
exports.setEncryptionKey = setEncryptionKey;
