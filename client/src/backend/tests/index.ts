import test from "tape";
import { getIbcDenom, getChannelId } from "../utils";

test("Testing 'getIbcDenom' and 'getChannelId' functions from './src/backend/utils'", (assert) => {
  const channelId = "channel-88";
  const nativeDenom = "uscrt";
  const ibcDenom =
    "ibc/0954E1C28EB7AF5B72D24F3BC2B47BBB2FDF91BDDFD57B74B99E133AED40972A";

  assert.equal(getIbcDenom(channelId, nativeDenom), ibcDenom, "getIbcDenom");
  assert.equal(getChannelId(nativeDenom, ibcDenom), channelId, "getChannelId");

  assert.end();
});
