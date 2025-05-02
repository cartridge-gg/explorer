import { ContractClassResponse } from "starknet";
import { ConstructorAbi, FunctionAbiWithAst, parseAbi } from "./abi";

export interface ContractClassInfo {
  constructor: ConstructorAbi;
  readFuncs: FunctionAbiWithAst[];
  writeFuncs: FunctionAbiWithAst[];
  code: {
    abi: string;
    sierra: string | undefined;
  };
}

export function getContractClassInfo(contractClass: ContractClassResponse): ContractClassInfo {
  return {
    ...parseAbi(contractClass.abi),
    code: {
      abi: JSON.stringify(contractClass.abi, null, 2),
      sierra: "sierra_program" in contractClass
        ? JSON.stringify(contractClass.sierra_program, null, 2)
        : undefined
    }
  };
}
