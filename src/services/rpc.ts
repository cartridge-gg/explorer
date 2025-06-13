"use client";
import { RpcProvider } from "starknet";
import { queryClient } from "./query";

// Moved from constants/rpc.ts
export const EXECUTION_RESOURCES_KEY_MAP = {
  bitwise_builtin_applications: "bitwise",
  pedersen_builtin_applications: "pedersen",
  range_check_builtin_applications: "range_check",
  poseidon_builtin_applications: "poseidon",
  steps: "steps",
  ecdsa_builtin_applications: "ecdsa",
  segment_arena_builtin: "segment_arena",
  keccak_builtin_applications: "keccak",
  memory_holes: "memory_holes",
  ec_op_builtin_applications: "ec_op",
};

export function basePath(): string | undefined {
  // See <vite.config.ts>
  if (import.meta.env.VITE_APP_IS_EMBEDDED) {
    const pathname = window.location.pathname;
    const explorerIndex = pathname.lastIndexOf("/explorer");

    if (explorerIndex !== -1) {
      return pathname.substring(0, explorerIndex) + "/explorer";
    } else {
      throw new Error(
        "Couldn't determine the base path. App is in embedded mode but `/explorer` was not found in the pathname",
      );
    }
  }
}

// In embedded mode, it is assumed that the explorer is served at the relative path `/explorer` of the JSON-RPC server.
export function rpcUrl(): string {
  // See <vite.config.ts>
  if (import.meta.env.VITE_APP_IS_EMBEDDED) {
    const pathname = window.location.pathname;
    const explorerIndex = pathname.lastIndexOf("/explorer");

    if (explorerIndex !== -1) {
      const basePath = pathname.substring(0, explorerIndex);
      return `${window.location.protocol}//${window.location.host}${basePath}`;
    } else {
      throw new Error(
        "Couldn't determine the RPC URL. App is in embedded mode but `/explorer` was not found in the pathname",
      );
    }
  }

  return import.meta.env.VITE_RPC_URL;
}

export const CHAIN_ID = window.CHAIN_ID ?? import.meta.env.VITE_CHAIN_ID;

// Cache constants
export const CACHE_TIME = 1000 * 60 * 60 * 24; // 24 hours
export const STALE_TIME = 1000 * 60 * 30; // 30 minutes

declare global {
  interface Window {
    RPC_URL?: string;
  }
}

// Create the base RPC provider
const baseRpcProvider = new RpcProvider({
  nodeUrl: rpcUrl(),
});

// useful for caching - only immutable/stable data
export const QUERY_KEYS = {
  getBlockNumber: ["getBlockNumber"], // Re-added for BlockNumberProvider with short cache
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

// Cache configuration
const CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
};

// Create a proxy that intercepts method calls and adds caching for specific methods
export const RPC_PROVIDER = new Proxy(baseRpcProvider, {
  get(target, prop: string | symbol) {
    const originalMethod = target[prop as keyof typeof target];

    // Check if this method should be cached
    const queryKeyEntry = Object.entries(QUERY_KEYS).find(
      ([key]) => key === prop,
    );

    if (queryKeyEntry && typeof originalMethod === "function") {
      const [, queryKey] = queryKeyEntry;

      // Return a cached version of the method
      return function (this: typeof target, ...args: unknown[]) {
        const fullQueryKey =
          args.length > 0 ? [...queryKey, ...args] : queryKey;

        return queryClient.fetchQuery({
          queryKey: fullQueryKey,
          queryFn: () =>
            (originalMethod as (...args: unknown[]) => unknown).apply(
              target,
              args,
            ),
          ...CACHE_CONFIG,
        });
      };
    }

    // For non-cached methods, return the original method bound to the target
    if (typeof originalMethod === "function") {
      return originalMethod.bind(target);
    }

    // For properties, return as-is
    return originalMethod;
  },
});
