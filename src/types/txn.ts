import type {
  // L1 Handler
  L1_HANDLER_TXN,

  // Deploy
  DEPLOY_TXN,

  // Deploy Account
  DEPLOY_ACCOUNT_TXN_V1,
  DEPLOY_ACCOUNT_TXN_V3,

  // Invoke
  INVOKE_TXN_V0,
  INVOKE_TXN_V1,
  INVOKE_TXN_V3,

  // Declare
  DECLARE_TXN_V0,
  DECLARE_TXN_V2,
  DECLARE_TXN_V3,
  DECLARE_TXN_V1,
} from "@starknet-io/starknet-types-08";
import { MergeMultiple } from "./helpers";

export type TStarknetTransactionTypesMerged = MergeMultiple<
  [
    INVOKE_TXN_V0,
    INVOKE_TXN_V1,
    INVOKE_TXN_V3,
    L1_HANDLER_TXN,
    DECLARE_TXN_V0,
    DECLARE_TXN_V1,
    DECLARE_TXN_V2,
    DECLARE_TXN_V3,
    DEPLOY_TXN,
    DEPLOY_ACCOUNT_TXN_V1,
    DEPLOY_ACCOUNT_TXN_V3,
  ]
>;

export type TStarknetTransactionTypes =
  | INVOKE_TXN_V0
  | INVOKE_TXN_V1
  | INVOKE_TXN_V3
  | L1_HANDLER_TXN
  | DECLARE_TXN_V0
  | DECLARE_TXN_V1
  | DECLARE_TXN_V2
  | DECLARE_TXN_V3
  | DEPLOY_TXN
  | DEPLOY_ACCOUNT_TXN_V1
  | DEPLOY_ACCOUNT_TXN_V3;

// Helper types for invoke transactions
export const isInvokeV0 = (
  tx: TStarknetTransactionTypesMerged,
): tx is INVOKE_TXN_V0 => {
  return tx.type === "INVOKE" && Number(tx.version) === 0;
};

export const isInvokeV1 = (
  tx: TStarknetTransactionTypesMerged,
): tx is INVOKE_TXN_V1 => {
  return tx.type === "INVOKE" && Number(tx.version) === 1;
};

export const isInvokeV3 = (
  tx: TStarknetTransactionTypesMerged,
): tx is INVOKE_TXN_V3 => {
  return tx.type === "INVOKE" && Number(tx.version) === 3;
};

// Helper types for declare transactions
export const isDeclareV0 = (
  tx: TStarknetTransactionTypesMerged,
): tx is DECLARE_TXN_V0 => {
  return tx.type === "DECLARE" && Number(tx.version) === 0;
};

export const isDeclareV2 = (
  tx: TStarknetTransactionTypesMerged,
): tx is DECLARE_TXN_V2 => {
  return tx.type === "DECLARE" && Number(tx.version) === 2;
};

export const isDeclareV3 = (
  tx: TStarknetTransactionTypesMerged,
): tx is DECLARE_TXN_V3 => {
  return tx.type === "DECLARE" && Number(tx.version) === 3;
};

export const isDeclareV1 = (
  tx: TStarknetTransactionTypesMerged,
): tx is DECLARE_TXN_V1 => {
  return tx.type === "DECLARE" && Number(tx.version) === 1;
};

// Helper types for L1 Handlers transactions
export const isL1Handler = (
  tx: TStarknetTransactionTypesMerged,
): tx is L1_HANDLER_TXN => {
  return tx.type === "L1_HANDLER";
};

// Helper types for deploy transactions
export const isDeploy = (
  tx: TStarknetTransactionTypesMerged,
): tx is DEPLOY_TXN => {
  return tx.type === "DEPLOY";
};

// Helper types for deploy account transactions
export const isDeployAccountV1 = (
  tx: TStarknetTransactionTypesMerged,
): tx is DEPLOY_ACCOUNT_TXN_V1 => {
  return tx.type === "DEPLOY_ACCOUNT";
};

export const isDeployAccountV3 = (
  tx: TStarknetTransactionTypesMerged,
): tx is DEPLOY_ACCOUNT_TXN_V3 => {
  return tx.type === "DEPLOY_ACCOUNT" && Number(tx.version) === 3;
};

export type TStarknetTransactionTypeWithNonce =
  | INVOKE_TXN_V1
  | INVOKE_TXN_V3
  | L1_HANDLER_TXN
  | DECLARE_TXN_V1
  | DECLARE_TXN_V2
  | DECLARE_TXN_V3
  | DECLARE_TXN_V1
  | DEPLOY_ACCOUNT_TXN_V1
  | DEPLOY_ACCOUNT_TXN_V3;

/**
 * Check if a transaction has a nonce
 * @param tx {object} Transaction
 * @returns {boolean}
 */
export const txnHasNonce = (
  tx: TStarknetTransactionTypesMerged,
): tx is TStarknetTransactionTypeWithNonce => {
  return (
    (tx.type === "INVOKE" ||
      tx.type === "L1_HANDLER" ||
      tx.type === "DECLARE" ||
      tx.type === "DEPLOY_ACCOUNT") &&
    tx.nonce !== undefined
  );
};

export type TStarknetTransactionTypeWithSenderAddress =
  | INVOKE_TXN_V1
  | INVOKE_TXN_V3
  | DECLARE_TXN_V0
  | DECLARE_TXN_V1
  | DECLARE_TXN_V2
  | DECLARE_TXN_V3;

/**
 * Check if a transaction has a sender address
 * @param tx {object} Transaction
 * @returns {boolean}
 */
export const txnHasSenderAddress = (
  tx: TStarknetTransactionTypesMerged,
): tx is TStarknetTransactionTypeWithSenderAddress => {
  return (
    (tx.type === "INVOKE" || tx.type === "DECLARE") &&
    tx.sender_address !== undefined
  );
};

export type TStarknetTransactionTypeWithTip =
  | DECLARE_TXN_V3
  | DEPLOY_ACCOUNT_TXN_V3
  | INVOKE_TXN_V3;

/**
 * Check if a transaction has a tip
 * @param tx {object} Transaction
 * @returns {boolean}
 */
export const txnHasTip = (
  tx: TStarknetTransactionTypesMerged,
): tx is TStarknetTransactionTypeWithTip => {
  return (
    (tx.type === "DECLARE" ||
      tx.type === "DEPLOY_ACCOUNT" ||
      tx.type === "INVOKE") &&
    tx.tip !== undefined
  );
};

export type TStarknetTransactionTypeWithDataAvailabilityMode =
  | DECLARE_TXN_V3
  | DEPLOY_ACCOUNT_TXN_V3
  | INVOKE_TXN_V3;

/**
 * Check if a transaction has a data availability mode
 * @param tx {object} Transaction
 * @returns {boolean}
 */
export const txnHasNonceDataAvailabilityMode = (
  tx: TStarknetTransactionTypesMerged,
): tx is TStarknetTransactionTypeWithDataAvailabilityMode => {
  return (
    (tx.type === "DECLARE" ||
      tx.type === "DEPLOY_ACCOUNT" ||
      tx.type === "INVOKE") &&
    tx.fee_data_availability_mode !== undefined &&
    tx.nonce_data_availability_mode !== undefined
  );
};
