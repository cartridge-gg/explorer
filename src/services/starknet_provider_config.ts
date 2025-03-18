"use client";
import { RPC_URL } from "@/constants/rpc";
import { RpcProvider } from "starknet";

declare global {
  interface Window {
    RPC_URL?: string;
  }
}

export const RPC_PROVIDER = new RpcProvider({
  nodeUrl: RPC_URL,
});

// useful for caching
export const QUERY_KEYS = {
  getBlockNumber: ["getBlockNumber"],
  getBlockWithTxs: ["getBlockWithTxs"],
  getClassAt: ["getClassAt"],
  getTransactionReceipt: ["getTransactionReceipt"],
  getTransactionTrace: ["getTransactionTrace"],
  getTransaction: ["getTransaction"],
  getBlockWithTxHashes: ["getBlockWithTxHashes"],
  getBlock: ["getBlock"],
};
