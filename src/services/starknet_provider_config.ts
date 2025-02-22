"use client";
import { RpcProvider } from "starknet";

declare global {
  interface Window {
    RPC_URL?: string;
  }
}

export const RPC_PROVIDER = new RpcProvider({
  nodeUrl: window.RPC_URL ?? import.meta.env.VITE_RPC_URL,
});

// useful for caching
export const QUERY_KEYS = {
  getBlockNumber: ["getBlockNumber"],
  getBlockWithTxs: ["getBlockWithTxs"],
};
