export interface TUseBlocksProps {
  id?: number;
  from: number;
  to: number;
  chunkSize: number;
  continuationToken?: string;
}

/**
 * Custom class to access Katana's properties.
 *
 * Primarily used for Starknet's extensions API.
 */
export class KATANA {
  katanaURL: string;

  constructor(katanaURL: string) {
    this.katanaURL = katanaURL;
  }

  async getKatanaURL(): Promise<string> {
    return this.katanaURL;
  }

  /**
   *
   * @returns Lists of blocks with range-based queries.
   */
  async getBlocks({
    id,
    from,
    to,
    chunkSize,
    continuationToken,
  }: TUseBlocksProps) {
    const data = await fetch(this.katanaURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: id || 1,
        jsonrpc: "2.0",
        method: "starknet_getBlocks",
        params: [
          {
            from: from,
            to: to,
            result_page_request: {
              chunk_size: chunkSize,
              continuation_token: continuationToken,
            },
          },
        ],
      }),
    });

    return await data.json();
  }

  /**
   *
   * @returns Lists of transactions with range-based queries.
   */
  async getTransactions({
    id,
    from,
    to,
    chunkSize,
    continuationToken,
  }: TUseBlocksProps) {
    const data = await fetch(this.katanaURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: id || 1,
        jsonrpc: "2.0",
        method: "starknet_getTransactions",
        params: [
          {
            from: from,
            to: to,
            result_page_request: {
              chunk_size: chunkSize,
              continuation_token: continuationToken,
            },
          },
        ],
      }),
    });

    return await data.json();
  }

  /**
   *
   * Get the most recent accepted transaction number.
   *
   * Similar to `starknet_blockNumber` but for transaction.
   */
  async transactionNumber(id?: number) {
    const data = await fetch(this.katanaURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: id || 1,
        jsonrpc: "2.0",
        method: "starknet_transactionNumber",
        params: [],
      }),
    });

    return await data.json();
  }
}
