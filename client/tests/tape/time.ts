import test from "tape";
import { calcTimeDelta, l } from "../../src/common/utils";

test("Testing time functions", (a) => {
  const targetTime = { hours: 20, minutes: 0 };
  const period = { hours: 24, minutes: 0 };
  const ignoreRange: [
    { hours: number; minutes: number },
    { hours: number; minutes: number }
  ] = [
    { hours: 20, minutes: 0 },
    { hours: 20, minutes: 55 },
  ];

  l({
    targetTime,
    period,
    now: { hours: new Date().getHours(), minutes: new Date().getMinutes() },
    res: calcTimeDelta(targetTime, period, ignoreRange),
  });
  a.assert(true, "calcTimeDelta");

  a.end();
});
