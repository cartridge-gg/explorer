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
  if (import.meta.env.VITE_IS_EMBEDDED || import.meta.env.VITE_APP_IS_EMBEDDED) {
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
  if (import.meta.env.APP_IS_EMBEDDED) {
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
