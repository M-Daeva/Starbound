import { createHash } from "crypto";

/**
 * Returns IBC denom of native asset of chain B transferred from chain B to chain A, where
 * @param channelId - channel id on chain A
 * @param nativeDenom - native denom on chain B
 * @param portId - port id, 'transfer' by default
 * @returns IBC denom in form of 'ibc/{hash}'
 */
function getIbcDenom(
  channelId: string,
  nativeDenom: string,
  portId: string = "transfer"
) {
  return (
    "ibc/" +
    createHash("sha256")
      .update(`${portId}/${channelId}/${nativeDenom}`)
      .digest("hex")
      .toUpperCase()
  );
}

/**
 * Returns channel id on chain A for asset transferred from chain B to chain A, where
 * @param nativeDenom - native denom on chain B
 * @param ibcDenom - IBC denom of asset from chain B on chain A in form of 'ibc/{hash}'
 * @param portId - port id, 'transfer' by default
 * @returns channel id on chain A
 */
function getChannelId(
  nativeDenom: string,
  ibcDenom: string,
  portId: string = "transfer"
) {
  const maxChannelId = 10_000;
  const targetHash = ibcDenom.split("/")[1].toLowerCase();

  for (let i = 0; i < maxChannelId; i++) {
    const channelId = `channel-${i}`;
    const hash = createHash("sha256")
      .update(`${portId}/${channelId}/${nativeDenom}`)
      .digest("hex");

    if (hash === targetHash) return channelId;
  }
}

export { getIbcDenom, getChannelId };
