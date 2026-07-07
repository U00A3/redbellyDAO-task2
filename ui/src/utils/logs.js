const DEFAULT_CHUNK_SIZE = 99n;

/**
 * Redbelly testnet RPC rejects wide eth_getLogs ranges (~>100 blocks).
 * Fetch in small chunks from fromBlock through toBlock (inclusive).
 */
export async function getLogsChunked(publicClient, { address, event, fromBlock, toBlock, chunkSize = DEFAULT_CHUNK_SIZE }) {
  const allLogs = [];
  let cursor = fromBlock;

  while (cursor <= toBlock) {
    const chunkEnd = cursor + chunkSize > toBlock ? toBlock : cursor + chunkSize;
    const logs = await publicClient.getLogs({
      address,
      event,
      fromBlock: cursor,
      toBlock: chunkEnd,
    });
    allLogs.push(...logs);
    cursor = chunkEnd + 1n;
  }

  return allLogs;
}
