import { BlockWithTxHashes } from "starknet";
import API_CLIENT from "./api_client";
import { rpc_spec } from "@/constants/rpc";

const rpc_request_obj = {
  jsonrpc: "2.0",
  method: "",
  params: [],
  id: 1,
};

const RPC_CONFIG = new API_CLIENT(import.meta.env.VITE_CHAIN_RPC);

class RPC_METHODS {
  async fetch(method: string, params: { [key: string]: string | number }[]) {
    return await RPC_CONFIG.post("", {
      ...rpc_request_obj,
      method: method,
      params,
    });
  }
  async fetchLatestBlock(): Promise<number> {
    const response = await this.fetch(rpc_spec.getLatestBlockNumber, []);
    return response.data.result;
  }
  async fetchBlockWithTransactions(
    block_number: number
  ): Promise<BlockWithTxHashes> {
    const response = await this.fetch(rpc_spec.getBlockWithTransaction, [
      { block_number },
    ]);

    return response.data;
  }

  async fetchBlockWithTxHashes(
    block_number: number
  ): Promise<BlockWithTxHashes> {
    console.log("fetchBlockWithTxHashes", block_number);
    const response = await this.fetch(rpc_spec.getBlockWithTxHashes, [
      { block_number },
    ]);
    return response.data.result;
  }
}

// useful for caching
export const QUERY_KEYS = {
  latestBlockNumber: ["latestBlockNumber"],
  latestTransactionsByBlock: ["latestTransactionsByBlock"],
  blockWithTxHashes: ["blockWithTxHashes"],
};

export const RPC = new RPC_METHODS();
