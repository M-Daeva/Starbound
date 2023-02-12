import { Decimal } from "decimal.js";

// removes additional digits on display
function trimDecimal(price: string | Decimal, err: string = "0.001"): string {
  price = price.toString();
  if (!price.includes(".")) return price;

  const one = new Decimal("1");
  const target = one.sub(new Decimal(err));

  let priceNext = price;
  let ratio = one;

  while (ratio.greaterThan(target)) {
    price = price.slice(0, price.length - 1);
    priceNext = price.slice(0, price.length - 1);
    ratio = new Decimal(priceNext).div(new Decimal(price));
  }

  return price.replace(/0/g, "") === "." ? "0" : price;
}

export { trimDecimal };
