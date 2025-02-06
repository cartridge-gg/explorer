import { cairo } from "starknet";

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
