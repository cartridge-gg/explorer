import { cairo, GetTransactionResponse, shortString } from "starknet";
import BN from "bn.js";
import { FeltDisplayVariants } from "../components/FeltDisplayAsToggle";
import * as RPC08 from "@starknet-io/starknet-types-08";

// paginated response for latest block_numbers
export function getPaginatedBlockNumbers(block_number: number, limit: number) {
  const blockNumbers = [];
  for (let i = block_number; i > block_number - limit; i--) {
    blockNumbers.push(i);
  }
  return blockNumbers;
}

export interface DecodedCallData {
  contract: string;
  selector: string;
  args: string[];
}

// Function to decode Starknet calldata
export function decodeCalldata(
  tx: GetTransactionResponse,
): DecodedCallData[] | undefined {
  if (tx.version === "0x0" || !("calldata" in tx) || !tx.calldata) {
    return;
  }

  const calldata = tx.calldata ?? [];

  if (calldata.length === 0) {
    return [];
  }

  const numTxns = Number(cairo.felt(calldata[0])); // Number of transactions in batch
  const transactions: DecodedCallData[] = [];
  let index = 1; // Start after batch size

  for (let i = 0; i < numTxns; i++) {
    const contract = calldata[index]; // Contract address
    const sender = calldata[index + 1]; // Sender address
    const numArgs = Number(cairo.felt(calldata[index + 2])); // Number of arguments

    // Extract arguments dynamically
    const args = calldata.slice(index + 3, index + 3 + numArgs);

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
  execution_resources:
    | RPCSPEC08.API.EXECUTION_RESOURCES
    | RPCSPEC07.API.SPEC.EXECUTION_RESOURCES,
) {
  return Object.entries(execution_resources).reduce(
    (acc, [key, value]) => {
      switch (key) {
        case "l1_gas": {
          acc.blockComputeData.l1_gas += Number(value);
          break;
        }
        case "l2_gas": {
          acc.blockComputeData.l2_gas += Number(value);
          break;
        }
        case "l1_data_gas": {
          acc.blockComputeData.l1_data_gas += Number(value);
          break;
        }
        case "data_availability": {
          if (typeof value === "number") {
            break;
          }

          // Handle legacy format for backward compatibility
          acc.blockComputeData.l1_gas += value.l1_gas;
          acc.blockComputeData.l1_data_gas += value.l1_data_gas;
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
      blockComputeData: initBlockComputeData,
    },
  );
}

export const initBlockComputeData = {
  l1_gas: 0,
  l2_gas: 0,
  l1_data_gas: 0,
};
