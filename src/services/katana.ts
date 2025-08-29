import type { BlockWithTxHashes } from "starknet";
import type { TTransactionList } from "@/types/types";

export interface TUseBlocksProps {
  /**
   * Unique identifier for that specific request
   */
  id?: number;
  /**
   * The starting transaction number (inclusive). For descending order, this should be higher
   * than to.
   */
  from: number;
  /**
   * The ending transaction number (inclusive). If not provided, returns transactions starting
   * from `from`. For descending order, this should be lower than `from`.
   */
  to: number;
  /**
   * Chunk size
   */
  chunkSize: number;
  /**
   * The token returned from the previous query. If no token is provided the first page is
   * returned.
   */
  continuationToken?: string;
}

export type TUseTransactionsProps = TUseBlocksProps;

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

    const res = await data.json();

    return res.result.blocks as Array<BlockWithTxHashes>;
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
  }: TUseTransactionsProps): Promise<Array<TTransactionList>> {
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

    const res = await data.json();

    return res.result.transactions as Array<TTransactionList>;
  }

  /**
   *
   * Get the most recent accepted transaction number.
   *
   * Similar to `starknet_blockNumber` but for transaction.
   */
  async transactionNumber(id?: number): Promise<number> {
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

    const res = await data.json();

    return Number(res.result);
  }
}
