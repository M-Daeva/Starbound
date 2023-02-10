import test from "tape";
import {
  getIbcDenom,
  getChannelId,
  encode,
  decode,
} from "../../src/common/utils";

test("Testing 'getIbcDenom' and 'getChannelId' (uscrt)", (a) => {
  const channelId = "channel-88";
  const srcDenom = "uscrt";
  const dstDenom =
    "ibc/0954E1C28EB7AF5B72D24F3BC2B47BBB2FDF91BDDFD57B74B99E133AED40972A";

  a.equal(getIbcDenom(channelId, srcDenom), dstDenom, "getIbcDenom");
  a.equal(getChannelId(srcDenom, dstDenom), channelId, "getChannelId");

  a.end();
});

// transfer/channel-0/uatom is intermediate denom of uatom received from channel-0
// and sent using other channel (channel-1561)
// it is represented in form of {port_id}/{channel_id}/{src_denom} without hashing
test("Testing 'getIbcDenom' and 'getChannelId' (transfer/channel-0/uatom)", (a) => {
  const channelId = "channel-1561";
  const srcDenom = "transfer/channel-0/uatom";
  const dstDenom =
    "ibc/500230E11B247CBDAC611319F48144DC0008ACE1CB12E71C26C3EEB32576779F";

  a.equal(getIbcDenom(channelId, srcDenom), dstDenom, "getIbcDenom");
  a.equal(getChannelId(srcDenom, dstDenom), channelId, "getChannelId");

  a.end();
});

test("Testing 'encode' and 'decode'", (a) => {
  const data = "secret message";
  const key = "secret key";
  const encoded = encode(data, key);
  const decoded = decode(encoded, key);

  a.doesNotEqual(data, encoded, "encode");
  a.equal(data, decoded, "decode");

  a.end();
});
