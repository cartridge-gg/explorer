import {
  cairo,
  GetTransactionReceiptResponse,
  GetTransactionResponse,
  shortString,
} from "starknet";
import BN from "bn.js";
import { FeltDisplayVariants } from "../components/FeltDisplayAsToggle";
import { EXECUTION_RESOURCES_KEY_MAP } from "@/services/rpc";

// paginated response for latest block_numbers
export function getPaginatedBlockNumbers(block_number: number, limit: number) {
  const blockNumbers = [];
  for (let i = block_number; i > block_number - limit; i--) {
    blockNumbers.push(i);
  }
  return blockNumbers;
}

// Function to decode Starknet calldata
export function decodeCalldata(tx: GetTransactionResponse) {
  if (tx.version === "0x0" || !("calldata" in tx)) {
    return;
  }

  const numTxns = Number(cairo.felt(tx.calldata[0])); // Number of transactions in batch
  const transactions = [];
  let index = 1; // Start after batch size

  for (let i = 0; i < numTxns; i++) {
    const contract = tx.calldata[index]; // Contract address
    const sender = tx.calldata[index + 1]; // Sender address
    const numArgs = Number(cairo.felt(tx.calldata[index + 2])); // Number of arguments

    // Extract arguments dynamically
    const args = tx.calldata.slice(index + 3, index + 3 + numArgs);

    transactions.push({
      contract: contract,
      selector: sender,
      args: args,
    });

    index += numArgs + 3; // Move to next transaction set
  }

  return transactions;
}

// get formatted event name from event name
export function getEventName(eventName: string) {
  return eventName.split("::").pop() ?? "";
}

export const convertValue = (value: string | number) => {
  try {
    let bnValue: BN;

    // Convert input to BN
    if (typeof value === "string") {
      // Handle hex strings
      if (value.toLowerCase().startsWith("0x")) {
        bnValue = new BN(value.slice(2), 16);
      } else {
        bnValue = new BN(value);
      }
    } else {
      bnValue = new BN(value);
    }

    return {
      dec: bnValue.toString(10),
      hex: "0x" + bnValue.toString(16),
      string: shortString.decodeShortString(bnValue.toString()),
    };
  } catch {
    return null;
  }
};

// recurse throught an object and covert all values to hex
export const convertObjectValuesToDisplayValues = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  type: Exclude<FeltDisplayVariants[number], "string">,
) => {
  for (const key in obj) {
    if (typeof obj[key] === "object") {
      convertObjectValuesToDisplayValues(obj[key], type);
    } else {
      obj[key] = convertValue(obj[key])?.[
        type as keyof ReturnType<typeof convertValue>
      ];
    }
  }
  return obj;
};

export function parseExecutionResources(
  execution_resources: GetTransactionReceiptResponse["execution_resources"],
) {
  return Object.entries(execution_resources).reduce(
    (acc, [key, value]) => {
      switch (key) {
        case "steps": {
          acc.blockComputeData.steps += Number(value);
          break;
        }
        case "data_availability": {
          acc.blockComputeData.gas += value.l1_gas;
          acc.blockComputeData.data_gas += value.l1_data_gas;
          break;
        }
        default: {
          const _key = key as keyof typeof EXECUTION_RESOURCES_KEY_MAP;
          const keyMap = EXECUTION_RESOURCES_KEY_MAP[
            _key
          ] as keyof typeof acc.executions;
          if (!keyMap) return acc;

          acc.executions[keyMap] += Number(value) || 0;
        }
      }

      return acc;
    },
    {
      executions: initExecutions,
      blockComputeData: initBlockComputeData,
    },
  );
}

export const initExecutions = {
  ecdsa: 0,
  keccak: 0,
  bitwise: 0,
  pedersen: 0,
  poseidon: 0,
  range_check: 0,
  segment_arena: 0,
  memory_holes: 0,
  ec_op: 0,
};

export const initBlockComputeData = {
  gas: 0,
  steps: 0,
  data_gas: 0,
};
