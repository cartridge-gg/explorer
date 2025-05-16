import { ContractClassResponse, validateAndParseAddress } from "starknet";
import { FunctionAbiWithAst, parseAbi } from "./abi";

export interface ContractClassInfo {
  constructor: FunctionAbiWithAst;
  readFuncs: FunctionAbiWithAst[];
  writeFuncs: FunctionAbiWithAst[];
  code: {
    abi: string;
    sierra: string | undefined;
  };
}

export function getContractClassInfo(
  contractClass: ContractClassResponse,
): ContractClassInfo {
  return {
    ...parseAbi(contractClass.abi),
    code: {
      abi: JSON.stringify(contractClass.abi, null, 2),
      sierra:
        "sierra_program" in contractClass
          ? JSON.stringify(contractClass.sierra_program, null, 2)
          : undefined,
    },
  };
}

export function isValidAddress(address: string): boolean {
  try {
    validateAndParseAddress(address);
    return true;
  } catch {
    return false;
  }
}
