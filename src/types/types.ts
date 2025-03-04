// Function and API Types
export interface FunctionResult<T = unknown> {
  loading: boolean;
  error: string | null;
  data: T;
}

// Display Types
export type DisplayFormatTypes = "decimal" | "hex" | "string";

// Event Types
export interface EventDataItem {
  input: string;
  input_type: string;
  data: string;
}

// ParsedEvent type definition
export interface ParsedEvent {
  data: Record<string, string | number>;
  name: string;
  address: string;
}

export interface EventData {
  id: string;
  from: string;
  event_name: string;
  block: number;
  data?: ParsedEvent;
}

// Block Types
export type Block = {
  number: string;
  hash: string;
  age: string;
};

// Storage Types
export interface StorageDiffData {
  contract_address: string;
  key: string;
  value: string;
  block_number: number;
}

// Transaction Types
export type TransactionType =
  | "INVOKE"
  | "L1_HANDLER"
  | "DECLARE"
  | "DEPLOY"
  | "DEPLOY_ACCOUNT";

export type TransactionTableData = {
  hash: string;
  type: TransactionType;
  status: string;
  hash_display: string;
};

// Event Table Types
export type EventTableData = {
  id: string;
  txn_hash: string;
  from: string;
  age: string;
};

// Starknet Types
export interface StarknetTransactionReceipt {
  block_number: number;
  transaction_hash: string;
  events: Array<{
    data: string[];
    from_address: string;
    keys: string[];
  }>;
  execution_resources: {
    [key: string]: number;
  };
  type: "INVOKE" | "L1_HANDLER" | "DECLARE" | "DEPLOY" | "DEPLOY_ACCOUNT";
  actual_fee: {
    amount: string;
    unit: "WEI" | "FRI";
  };
  execution_status: "SUCCEEDED" | "REVERTED";
  finality_status: "ACCEPTED_ON_L2" | "ACCEPTED_ON_L1";
  messages_sent: Array<{
    to_address: string;
    payload: string[];
  }>;
  revert_reason?: string;
}

// Global Window Interface
declare global {
  interface Window {
    RPC_URL?: string;
    CHAIN_ID?: string;
    ENABLE_CONTROLLER?: boolean;
  }
}

// Execution Resources Map Type
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
} as const;

export type ExecutionResourcesKeyMap = typeof EXECUTION_RESOURCES_KEY_MAP;
