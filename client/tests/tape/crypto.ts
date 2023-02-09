import test from "tape";
import {
  getIbcDenom,
  getChannelId,
  encode,
  decode,
} from "../../src/common/utils";

test("Testing 'getIbcDenom' and 'getChannelId'", (t) => {
  const channelId = "channel-88";
  const nativeDenom = "uscrt";
  const ibcDenom =
    "ibc/0954E1C28EB7AF5B72D24F3BC2B47BBB2FDF91BDDFD57B74B99E133AED40972A";

  t.equal(getIbcDenom(channelId, nativeDenom), ibcDenom, "getIbcDenom");
  t.equal(getChannelId(nativeDenom, ibcDenom), channelId, "getChannelId");

  t.end();
});

test("Testing 'encode' and 'decode'", (t) => {
  const data = "secret message";
  const key = "secret key";
  const encoded = encode(data, key);
  const decoded = decode(encoded, key);

  t.doesNotEqual(data, encoded, "encode");
  t.equal(data, decoded, "decode");

  t.end();
});
