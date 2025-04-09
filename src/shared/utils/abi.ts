import {
  Abi,
  FunctionAbi,
  AbiEntry,
  AbiStruct,
  InterfaceAbi,
  AbiEnum,
} from "starknet";

/**
 * Creates an abstract syntax tree for the input types of a function in an ABI
 * @param abi The contract ABI
 * @param functionName The name of the function to analyze
 * @returns An abstract syntax tree of the function's input types
 */
export function createFunctionInputTypeAST(abi: Abi, functionName: string) {
  // Find the function in the ABI or in any interface
  const functionAbi = findFunctionInAbi(abi, functionName);

  if (!functionAbi) {
    throw new Error(`Function "${functionName}" not found in the ABI`);
  }

  // Create AST for each input
  return functionAbi.inputs.map((input: AbiEntry) => {
    return parseTypeToAST(input, abi);
  });
}

/**
 * Creates an abstract syntax tree for the output types of a function in an ABI
 * @param abi The contract ABI
 * @param functionName The name of the function to analyze
 * @returns An abstract syntax tree of the function's output types
 */
export function createFunctionOutputTypeAST(abi: Abi, functionName: string) {
  // Find the function in the ABI or in any interface
  const functionAbi = findFunctionInAbi(abi, functionName);

  if (!functionAbi) {
    throw new Error(`Function "${functionName}" not found in the ABI`);
  }

  // Create AST for each output
  return functionAbi.outputs.map((output: AbiEntry) => {
    return parseTypeToAST(output, abi);
  });
}

/**
 * Finds a function in the ABI, searching through top-level functions and interfaces
 * @param abi The contract ABI
 * @param functionName The name of the function to find
 * @returns The function ABI or undefined if not found
 */
function findFunctionInAbi(
  abi: Abi,
  functionName: string
): FunctionAbi | undefined {
  // First try to find it at the top level
  const directFunction = abi.find(
    (item): item is FunctionAbi =>
      "type" in item &&
      (item.type === "function" ||
        item.type === "l1_handler" ||
        item.type === "constructor") &&
      "name" in item &&
      item.name === functionName
  );

  if (directFunction) {
    return directFunction;
  }

  // Example of "type: interface"
  // {
  //   "type": "interface",
  //   "name": "controller::account::ICartridgeAccount",
  //   "items": [
  //     {
  //       "type": "function",
  //       "name": "__validate_declare__",
  //       "inputs": [
  //         {
  //           "name": "class_hash",
  //           "type": "core::felt252"
  //         }
  //       ],
  //       "outputs": [
  //         {
  //           "type": "core::felt252"
  //         }
  //       ],
  //       "state_mutability": "external"
  //     },
  //   ]
  // },
  //
  // If not found, look in interfaces
  for (const item of abi) {
    if ("type" in item && item.type === "interface" && "items" in item) {
      const interfaceAbi = item as InterfaceAbi;
      const interfaceFunction = interfaceAbi.items.find(
        (func) => func.name === functionName
      );

      if (interfaceFunction) {
        return interfaceFunction;
      }
    }
  }

  return undefined;
}

/**
 * Finds a struct definition in the ABI by name
 * @param abi The contract ABI
 * @param structName The name of the struct to find
 * @returns The struct definition or undefined if not found
 */
function findStructDefinition(
  abi: Abi,
  structName: string
): AbiStruct | undefined {
  // First search at the top level
  const topLevelStruct = abi.find(
    (item): item is AbiStruct =>
      "type" in item &&
      item.type === "struct" &&
      "name" in item &&
      item.name === structName
  );

  return topLevelStruct;
}

/**
 * Finds an enum definition in the ABI by name
 * @param abi The contract ABI
 * @param enumName The name of the enum to find
 * @returns The enum definition or undefined if not found
 */
function findEnumDefinition(abi: Abi, enumName: string): AbiEnum | undefined {
  // First search at the top level
  const topLevelEnum = abi.find(
    (item): item is AbiEnum =>
      "type" in item &&
      item.type === "enum" &&
      "name" in item &&
      item.name === enumName
  );

  return topLevelEnum;
}

/**
 * Parses an ABI entry to create a type AST node
 * @param entry The ABI entry to parse
 * @param abi The full ABI to look up struct and enum definitions
 * @param processedTypes Set of type names that have been processed (for circular reference detection)
 * @returns A type AST node
 */
function parseTypeToAST(
  entry: AbiEntry,
  abi: Abi,
  processedTypes: Set<string> = new Set()
) {
  const { name, type } = entry;

  // Create base node
  const node = {
    name,
    type,
    kind: getTypeKind(type),
    children: [] as any[],
  };

  // Handle arrays (types ending with '*')
  if (type.endsWith("*")) {
    const baseType = type.slice(0, -1);
    node.kind = "array";
    node.children.push({
      name: "element",
      type: baseType,
      kind: getTypeKind(baseType),
      children: [],
    });

    // If array contains complex types, process them too
    if (
      getTypeKind(baseType) === "struct" ||
      getTypeKind(baseType) === "enum"
    ) {
      // Create a dummy entry for recursive call
      const arrayElementEntry: AbiEntry = { name: "element", type: baseType };
      const childNode = parseTypeToAST(arrayElementEntry, abi, processedTypes);
      // Replace the simple child with the fully processed type
      if (childNode.children.length > 0) {
        node.children[0].children = childNode.children;
      }
    }
  }

  // Handle structs
  if (node.kind === "struct" && !processedTypes.has(type)) {
    processedTypes.add(type); // Mark as being processed to avoid circular references

    const structDef = findStructDefinition(abi, type);
    if (structDef) {
      // Add all struct members as children
      structDef.members.forEach((member) => {
        const memberNode = parseTypeToAST(member, abi, processedTypes);
        node.children.push(memberNode);
      });
    }
  }

  // Handle enums
  if (node.kind === "enum" && !processedTypes.has(type)) {
    processedTypes.add(type); // Mark as being processed to avoid circular references

    const enumDef = findEnumDefinition(abi, type);
    if (enumDef) {
      // Add all enum variants as children
      enumDef.variants.forEach((variant) => {
        const variantNode = {
          name: variant.name,
          type: variant.type,
          kind: "variant",
          offset: variant.offset,
          children: [] as any[],
        };

        // If the variant has a complex type, parse it recursively
        if (
          getTypeKind(variant.type) !== "primitive" &&
          getTypeKind(variant.type) !== "numeric" &&
          getTypeKind(variant.type) !== "boolean"
        ) {
          const childType = parseTypeToAST(
            { name: variant.name, type: variant.type },
            abi,
            processedTypes
          );
          if (childType.children.length > 0) {
            variantNode.children = childType.children;
          }
        }

        node.children.push(variantNode);
      });
    }
  }

  // Handle tuples (could extend this implementation based on specific tuple format)
  if (node.kind === "tuple") {
    // Tuple handling would depend on how tuples are represented in the ABI
    // This is a placeholder for future implementation
  }

  return node;
}

/**
 * Determines the kind of a type from its string representation
 * @param type The type string from ABI
 * @returns The kind classification of the type
 */
function getTypeKind(type: string): string {
  if (type === "felt" || type === "felt*") return "primitive";
  if (type.startsWith("u") || type.startsWith("i")) return "numeric";
  if (type === "bool") return "boolean";
  if (type.includes("Array")) return "array";
  if (type.includes("Span")) return "array"; // Starknet arrays using Span syntax
  if (type.includes("Tuple")) return "tuple";
  if (type === "event") return "event";
  if (type.endsWith("*")) return "array";

  // Check if it's an enum by naming convention (this could be improved)
  // We'll assume enums have capitalized names with underscore separators
  // This is just a heuristic - ideally we'd check against actual enum definitions
  if (/^[A-Z][a-zA-Z0-9]*(_[A-Z][a-zA-Z0-9]*)*$/.test(type)) {
    return "enum";
  }

  // Default to struct for custom types
  return "struct";
}
