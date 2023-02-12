import test from "tape";
import { trimDecimal } from "../../src/common/helpers/general";

test("Testing general helpers", (a) => {
  const priceListSrc = [
    "0.000001",
    "0.000011",
    "0.000111",
    "0.001111",
    "0.011111",
    "0.111111",
    "1.111111",
    "11.111111",
    "111.111111",
    "1111.111111",
    "11111.111111",
    "111111.111111",
  ];

  const priceListToDisplay = [
    "0",
    "0.00001",
    "0.00011",
    "0.00111",
    "0.0111",
    "0.111",
    "1.11",
    "11.1",
    "111",
    "1111",
    "11111",
    "111111",
  ];

  a.deepEqual(
    priceListSrc.map((item) => trimDecimal(item, "0.001")),
    priceListToDisplay,
    "trimPrice"
  );

  a.end();
});
