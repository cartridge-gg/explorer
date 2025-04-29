import { ContractClassResponse, FunctionAbi, InterfaceAbi } from "starknet";
import { ConstructorAbi } from "../components/contract/types";

export function parseClassFunctions(contractClass: ContractClassResponse) {
  let constructor: ConstructorAbi;
  const readFuncs: FunctionAbi[] = [];
  const writeFuncs: FunctionAbi[] = [];

  contractClass.abi.forEach((item) => {
    switch (item.type) {
      case "constructor": {
        const _item = item as Omit<FunctionAbi, "outputs">;
        constructor = {
          inputs: _item.inputs.map((input) => ({
            name: input.name,
            type: input.type,
          })),
        };
        break;
      }
      case "interface": {
        const _item = item as InterfaceAbi;
        _item.items.forEach((func) => {
          if (func.type === "function") {
            if (isReadFunction(func)) {
              readFuncs.push(func);
            } else {
              writeFuncs.push(func);
            }
          }
        });
        break;
      }
      case "function": {
        const _item = item as FunctionAbi;
        if (isReadFunction(_item)) {
          readFuncs.push(_item);
        } else {
          writeFuncs.push(_item);
        }
        break;
      }
      default:
        break;
      }
  });

  return {
    constructor: constructor!,
    readFuncs,
    writeFuncs,
    abi: JSON.stringify(contractClass.abi, null, 2),
    sierra: "sierra_program" in contractClass
      ? JSON.stringify(contractClass.sierra_program, null, 2)
      : undefined
  };
}

function isReadFunction(func: FunctionAbi) {
  return func.state_mutability === "view" || func.state_mutability === "pure";
}
