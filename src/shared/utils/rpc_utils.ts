import { cairo, shortString } from "starknet";
import BN from "bn.js";
import { FeltDisplayVariants } from "../components/FeltDisplayAsToggle";

// paginated response for latest block_numbers
export function getPaginatedBlockNumbers(block_number: number, limit: number) {
  const blockNumbers = [];
  for (let i = block_number; i > block_number - limit; i--) {
    blockNumbers.push(i);
  }
  return blockNumbers;
}

// Function to decode Starknet calldata
export function decodeCalldata(calldata: string[]) {
  const numTxns = Number(cairo.felt(calldata[0])); // Number of transactions in batch
  const transactions = [];
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
  } catch (_error) {
    return null;
  }
};

// recurse throught an object and covert all values to hex
export const convertObjectValuesToDisplayValues = (
  obj: any,
  type: Exclude<(typeof FeltDisplayVariants)[number], "string">
) => {
  for (const key in obj) {
    if (typeof obj[key] === "object") {
      convertObjectValuesToDisplayValues(obj[key], type);
    } else {
      obj[key] = convertValue(obj[key])?.[type];
    }
  }
  return obj;
};
