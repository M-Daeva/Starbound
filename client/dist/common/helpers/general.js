"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimDecimal = void 0;
const decimal_js_1 = require("decimal.js");
// removes additional digits on display
function trimDecimal(price, err = "0.001") {
    price = price.toString();
    if (!price.includes("."))
        return price;
    const one = new decimal_js_1.Decimal("1");
    const target = one.sub(new decimal_js_1.Decimal(err));
    let priceNext = price;
    let ratio = one;
    while (ratio.greaterThan(target)) {
        price = price.slice(0, price.length - 1);
        priceNext = price.slice(0, price.length - 1);
        ratio = new decimal_js_1.Decimal(priceNext).div(new decimal_js_1.Decimal(price));
    }
    return price.replace(/0/g, "") === "." ? "0" : price;
}
exports.trimDecimal = trimDecimal;
