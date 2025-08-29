import { BlockWithTxHashes, RpcProvider } from "starknet";
import { queryClient } from "./query";
import {
  KATANA,
  type TUseBlocksProps,
  type TUseTransactionsProps,
} from "./katana";
import { TTransactionList } from "@/types/types";

export function getBasePath(): string | undefined {
  // See <vite.config.ts>
  if (import.meta.env.VITE_IS_EMBEDDED) {
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
export function getRpcUrl(): string {
  // See <vite.config.ts>
  if (import.meta.env.VITE_IS_EMBEDDED) {
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

export async function getChainId(): Promise<string> {
  return window.CHAIN_ID ?? (await RPC_PROVIDER.getChainId());
}

// Extended RPC Provider type that includes Katana methods when embedded
type ExtendedRpcProvider = RpcProvider & {
  getBlocks?: (props: TUseBlocksProps) => Promise<Array<BlockWithTxHashes>>;
  getTransactions?: (
    props: TUseTransactionsProps,
  ) => Promise<Array<TTransactionList>>;
  transactionNumber?: (id?: number) => Promise<number>;
  getKatanaURL?: () => Promise<string>;
};

declare global {
  interface Window {
    RPC_URL?: string;
    CHAIN_ID?: string;
  }
}

// Create the base RPC provider
const baseRpcProvider = new RpcProvider({
  nodeUrl: getRpcUrl(),
  specVersion: "0.9.0",
});

export const QUERY_KEYS = [
  "getBlockNumber",
  "getBlockWithTxs",
  "getBlockWithReceipts",
  "getClassAt",
  "getClassHashAt",
  "getTransactionReceipt",
  "getTransactionTrace",
  "getTransaction",
  "getBlockWithTxHashes",
  "getBlock",
  "specVersion",
  "getController",
  "getBlocks",
  "getTransactions",
  "transactionNumber",
];

// Cache configuration
export const CACHE_CONFIG = {
  staleTime: 1000 * 60 * 30, // 30 minutes
  gcTime: 1000 * 60 * 60 * 24, // 24 hours
};

export interface RpcCapabilities {
  hasKatanaExtensions: boolean;
  supportedMethods: string[];
}

// Function to detect RPC capabilities
export async function detectRpcCapabilities(): Promise<RpcCapabilities> {
  const katanaMethods = [
    "starknet_getBlocks",
    "starknet_getTransactions",
    "starknet_transactionNumber",
  ];
  const supportedMethods: string[] = [];

  // Test each method to see if it's supported
  for (const method of katanaMethods) {
    try {
      // Make a test call to see if the method exists
      const response = await fetch(getRpcUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method,
          params:
            method === "starknet_transactionNumber"
              ? []
              : [{ from: 0, to: 0, result_page_request: { chunk_size: 1 } }],
          id: 1,
        }),
      });

      const result = await response.json();

      // If we don't get a "method not found" error, the method is supported
      if (!result.error || result.error.code !== -32601) {
        supportedMethods.push(method);
      }
    } catch (error) {
      console.warn(`Failed to test method ${method}:`, error);
    }
  }

  return {
    hasKatanaExtensions: supportedMethods.length === katanaMethods.length,
    supportedMethods,
  };
}

export const katana = new KATANA(getRpcUrl());

// Create a proxy that intercepts method calls and adds caching for specific methods
export const RPC_PROVIDER = new Proxy(baseRpcProvider as ExtendedRpcProvider, {
  get(target, prop) {
    const originalMethod = target[prop as keyof typeof target];
    const methodName = prop as string;

    // In embedded mode, check if the method exists on katana instance
    let methodToCall = originalMethod;

    const katanaMethod = katana[methodName as keyof typeof katana];
    if (typeof katanaMethod === "function") {
      methodToCall = katanaMethod.bind(katana);
    }

    // Early return for properties (non-functions)
    if (typeof methodToCall !== "function") {
      return methodToCall;
    }

    // Early return for non-cached methods
    if (!QUERY_KEYS.includes(methodName)) {
      return methodToCall;
    }

    // Return cached version for queryable methods
    const queryKey = [methodName];
    return function (this: typeof target, ...args: unknown[]) {
      const fullQueryKey = args.length > 0 ? [...queryKey, ...args] : queryKey;

      return queryClient.fetchQuery({
        queryKey: fullQueryKey,
        queryFn: () =>
          (methodToCall as (...args: unknown[]) => unknown).apply(
            methodToCall === originalMethod ? target : katana,
            args,
          ),
        ...CACHE_CONFIG,
      });
    };
  },
});
