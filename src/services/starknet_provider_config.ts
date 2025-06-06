"use client";
import { rpcUrl } from "@/constants/rpc";
import { RpcProvider } from "starknet";

declare global {
  interface Window {
    RPC_URL?: string;
  }
}

export const RPC_PROVIDER = new RpcProvider({
  nodeUrl: rpcUrl(),
});

// useful for caching
export const QUERY_KEYS = {
  getBlockNumber: ["getBlockNumber"],
  getBlockWithTxs: ["getBlockWithTxs"],
  getBlockWithReceipts: ["getBlockWithReceipts"],
  getClassAt: ["getClassAt"],
  getClassHashAt: ["getClassHashAt"],
  getTransactionReceipt: ["getTransactionReceipt"],
  getTransactionTrace: ["getTransactionTrace"],
  getTransaction: ["getTransaction"],
  getBlockWithTxHashes: ["getBlockWithTxHashes"],
  getBlock: ["getBlock"],
  specVersion: ["specVersion"],
  getController: ["getController"],
};
