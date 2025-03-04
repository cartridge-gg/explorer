export const EXECUTION_RESOURCES_KEY_MAP = {
  bitwise_builtin_applications: "bitwise",
  pedersen_builtin_applications: "pedersen",
  range_check_builtin_applications: "range_check",
  poseidon_builtin_applications: "posiedon",
  steps: "steps",
  ecdsa_builtin_applications: "ecdsa",
  segment_arena_builtin: "segment_arena",
  keccak_builtin_applications: "keccak",
  memory_holes: "memory_holes",
  ec_op_builtin_applications: "ec_op",
};

export const RPC_URL = window.RPC_URL ?? import.meta.env.VITE_RPC_URL;
export const CHAIN_ID = window.CHAIN_ID ?? import.meta.env.VITE_CHAIN_ID;
