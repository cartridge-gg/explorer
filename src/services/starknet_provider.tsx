"use client";
import { RpcProvider } from "starknet";

export const RPC_PROVIDER = new RpcProvider({
  nodeUrl: import.meta.env.VITE_CHAIN_RPC,
});

// useful for caching
export const QUERY_KEYS = {
  getBlockNumber: ["getBlockNumber"],
  getBlockWithTxs: ["getBlockWithTxs"],
};
