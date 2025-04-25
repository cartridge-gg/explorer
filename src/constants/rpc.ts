import { shortString } from "starknet";

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

export const IS_EMBEDDED =
  window.IS_EMBEDDED ?? import.meta.env.VITE_IS_EMBEDDED;

export const RPC_URL =
  IS_EMBEDDED === "true"
    ? window.location.origin
    : window.RPC_URL ?? import.meta.env.VITE_RPC_URL;

export const CHAIN_ID =
  IS_EMBEDDED === "true"
    ? window.CHAIN_ID
    : import.meta.env.VITE_CHAIN_ID ??
      BigInt(shortString.encodeShortString("KATANA"));

export const CHAIN_NAME =
  IS_EMBEDDED === "true"
    ? window.CHAIN_NAME
    : import.meta.env.VITE_CHAIN_NAME ?? "Katana Local";

export const CHAIN_NETWORK =
  IS_EMBEDDED === "true"
    ? window.CHAIN_NETWORK
    : import.meta.env.VITE_CHAIN_NETWORK ?? "katana";

// Cache constants
export const CACHE_TIME = 1000 * 60 * 60 * 24; // 24 hours
export const STALE_TIME = 1000 * 60 * 30; // 30 minutes
