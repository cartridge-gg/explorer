import { CompiledSierra } from "starknet";
import { LegacyContractClass } from "starknet";
import { Constructor, Function } from "@/shared/components/contract/types";

export function parseClassFunctions(contractClass: LegacyContractClass | Omit<CompiledSierra, "sierra_program_debug_info">) {
  let constructor: Constructor;
  const readFuncs: Function[] = [];
  const writeFuncs: Function[] = [];

  contractClass.abi.forEach((item) => {
    switch (item.type) {
      case "constructor": {
        constructor = {
          inputs: item.inputs.map((input) => ({
            name: input.name,
            type: input.type,
          })),
        };
        break;
      }
      case "interface": {
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
        break;
      }
      default:
        break;
      }
  });

  return { constructor: constructor!, readFuncs, writeFuncs };
}
