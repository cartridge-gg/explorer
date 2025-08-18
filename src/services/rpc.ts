import { RpcProvider } from "starknet";
import { queryClient } from "./query";
import {
  KATANA,
  type TUseBlocksProps,
  type TUseTransactionsProps,
  type TTransactionList,
} from "./katana";
import * as RPC08 from "@starknet-io/types-js";

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
  getBlocks?: (props: TUseBlocksProps) => Promise<Array<RPC08.BlockWithTxs>>;
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

export const katana = new KATANA(import.meta.env.VITE_RPC_URL);

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
