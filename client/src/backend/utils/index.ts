import { createHash } from "crypto";

function getIbcDenom(
  channelId: string,
  denom: string,
  portId: string = "transfer"
) {
  return (
    "ibc/" +
    createHash("sha256")
      .update(`${portId}/${channelId}/${denom}`)
      .digest("hex")
      .toUpperCase()
  );
}

export { getIbcDenom };
