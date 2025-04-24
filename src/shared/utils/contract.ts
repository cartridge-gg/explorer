import { CompiledSierra } from "starknet";
import { LegacyContractClass } from "starknet";
import { Function } from "@/shared/components/contract/types";

export function parseClassFunctions(contractClass: LegacyContractClass | Omit<CompiledSierra, "sierra_program_debug_info">) {
  const readFuncs: Function[] = [];
  const writeFuncs: Function[] = [];

  contractClass.abi.forEach((item) => {
    if (item.type === "interface") {
      item.items.forEach((func) => {
        if (func.type === "function") {
          const funcData = {
            name: func.name,
            inputs: func.inputs.map((input) => ({
              name: input.name,
              type: input.type,
            })),
            selector: func.selector || "",
          };

          if (
            func.state_mutability === "view" ||
            func.state_mutability === "pure"
          ) {
            readFuncs.push(funcData);
          } else {
            writeFuncs.push(funcData);
          }
        }
      });
    }
  });

  return { readFuncs, writeFuncs };
}
