// Type kinds
type TypeKind =
  | "primitive"
  | "struct"
  | "enum"
  | "array"
  | "span"
  | "tuple"
  | "unknown";

// Base interface for all type nodes
interface TypeNode {
  name: string;
  kind: TypeKind;
  originalType: string; // The original type string from the ABI
}

// Primitive types like felt252, ClassHash, ContractAddress
interface PrimitiveTypeNode extends TypeNode {
  kind: "primitive";
}

// For tuple types
interface TupleTypeNode extends TypeNode {
  kind: "tuple";
  elements: TypeNode[];
}

// For array types like Array<T>
interface ArrayTypeNode extends TypeNode {
  kind: "array";
  elementType: TypeNode;
}

// For span types like Span<T>
interface SpanTypeNode extends TypeNode {
  kind: "span";
  elementType: TypeNode;
}

// For struct types
interface StructTypeNode extends TypeNode {
  kind: "struct";
  members: StructMember[];
}

interface StructMember {
  name: string;
  type: TypeNode;
  offset?: number;
}

// For enum types
interface EnumTypeNode extends TypeNode {
  kind: "enum";
  variants: EnumVariant[];
}

interface EnumVariant {
  name: string;
  type: TypeNode;
  offset?: number;
}

// For unknown types that couldn't be resolved
interface UnknownTypeNode extends TypeNode {
  kind: "unknown";
}

// Union type for all possible type nodes
type AbiTypeNode =
  | PrimitiveTypeNode
  | StructTypeNode
  | EnumTypeNode
  | ArrayTypeNode
  | SpanTypeNode
  | TupleTypeNode
  | UnknownTypeNode;

// Function parameter representation
interface FunctionParameter {
  name: string;
  type: AbiTypeNode;
}

// Function return value representation
interface FunctionReturn {
  name?: string; // Return values might not have names
  type: AbiTypeNode;
}

// Complete function representation
interface FunctionAst {
  name: string;
  inputs: FunctionParameter[];
  outputs: FunctionReturn[];
  stateMutability?: string;
}

/**
 * Builds an AST for a specific function from a Starknet ABI
 */
export function buildAstForFunction(
  abi: any[],
  functionName: string
): {
  function: FunctionAst | null;
  typeMap: Map<string, AbiTypeNode>;
} {
  // Maps to store parsed types
  const typeMap = new Map<string, AbiTypeNode>();
  let targetFunction: FunctionAst | null = null;

  // First pass: collect all type definitions (structs, enums, etc.)
  for (const item of abi) {
    if (item.type === "struct") {
      const structNode: StructTypeNode = {
        name: item.name,
        kind: "struct",
        originalType: item.name,
        members: item.members.map((member: any) => ({
          name: member.name,
          type: {
            name: member.type,
            kind: "unknown",
            originalType: member.type,
          },
          offset: member.offset,
        })),
      };
      typeMap.set(item.name, structNode);
    } else if (item.type === "enum") {
      const enumNode: EnumTypeNode = {
        name: item.name,
        kind: "enum",
        originalType: item.name,
        variants: item.variants.map((variant: any) => ({
          name: variant.name,
          type: {
            name: variant.type,
            kind: "unknown",
            originalType: variant.type,
          },
          offset: variant.offset,
        })),
      };
      typeMap.set(item.name, enumNode);
    }
    // Find the target function
    else if (
      (item.type === "function" ||
        item.type === "constructor" ||
        item.type === "l1_handler") &&
      item.name === functionName
    ) {
      targetFunction = {
        name: item.name,
        inputs:
          item.inputs?.map((input: any) => ({
            name: input.name,
            type: {
              name: input.type,
              kind: "unknown",
              originalType: input.type,
            },
          })) || [],
        outputs:
          item.outputs?.map((output: any) => ({
            name: output.name,
            type: {
              name: output.type || output.originalType,
              kind: "unknown",
              originalType: output.type || output.originalType,
            },
          })) || [],
        stateMutability: item.state_mutability || item.stateMutability,
      };
    }
  }

  // If we didn't find the function, return null
  if (!targetFunction) {
    return { function: null, typeMap };
  }

  // Resolve types for the target function
  for (const input of targetFunction.inputs) {
    input.type = resolveType(input.type.originalType, typeMap);
  }

  for (const output of targetFunction.outputs) {
    output.type = resolveType(output.type.originalType, typeMap);
  }

  // Recursively resolve all referenced types
  resolveReferencedTypes(targetFunction, typeMap);

  return { function: targetFunction, typeMap };
}

/**
 * Recursively resolves all types referenced by a function
 */
function resolveReferencedTypes(
  func: FunctionAst,
  typeMap: Map<string, AbiTypeNode>
) {
  const processedTypes = new Set<string>();
  const typesToProcess: AbiTypeNode[] = [];

  // Start with function inputs and outputs
  func.inputs.forEach((input) => typesToProcess.push(input.type));
  func.outputs.forEach((output) => typesToProcess.push(output.type));

  // Process each type and any referenced types
  while (typesToProcess.length > 0) {
    const typeNode = typesToProcess.shift()!;

    // Skip if already processed
    if (processedTypes.has(typeNode.originalType)) {
      continue;
    }

    processedTypes.add(typeNode.originalType);

    // Resolve nested types based on kind
    if (typeNode.kind === "struct") {
      const structNode = typeNode as StructTypeNode;
      for (const member of structNode.members) {
        if (member.type.kind === "unknown") {
          member.type = resolveType(member.type.originalType, typeMap);
        }
        typesToProcess.push(member.type);
      }
    } else if (typeNode.kind === "enum") {
      const enumNode = typeNode as EnumTypeNode;
      for (const variant of enumNode.variants) {
        if (variant.type.kind === "unknown") {
          variant.type = resolveType(variant.type.originalType, typeMap);
        }
        typesToProcess.push(variant.type);
      }
    } else if (typeNode.kind === "array" || typeNode.kind === "span") {
      const containerNode = typeNode as ArrayTypeNode | SpanTypeNode;
      typesToProcess.push(containerNode.elementType);
    } else if (typeNode.kind === "tuple") {
      const tupleNode = typeNode as TupleTypeNode;
      tupleNode.elements.forEach((element) => typesToProcess.push(element));
    }
  }
}

/**
 * Generate a sample JSON value for a function's input parameters
 */
function generateFunctionInputJson(functionAst: FunctionAst): string {
  const result: Record<string, any> = {};

  for (const input of functionAst.inputs) {
    result[input.name] = generateValueForType(input.type);
  }

  return JSON.stringify(result, null, 2);
}

/**
 * Generate a sample value for a given type
 */
function generateValueForType(typeNode: AbiTypeNode): any {
  switch (typeNode.kind) {
    case "primitive":
      if (
        typeNode.name.includes("felt252") ||
        typeNode.name.includes("ClassHash") ||
        typeNode.name.includes("ContractAddress")
      ) {
        return "0x123abc";
      } else if (typeNode.name.includes("bool")) {
        return true;
      } else if (
        typeNode.name.includes("::u") ||
        typeNode.name.includes("::i")
      ) {
        return 42;
      } else if (typeNode.name === "()") {
        return null;
      }
      return "value";

    case "struct": {
      const structNode = typeNode as StructTypeNode;
      const result: Record<string, any> = {};
      for (const member of structNode.members) {
        result[member.name] = generateValueForType(member.type);
      }
      return result;
    }

    case "enum": {
      const enumNode = typeNode as EnumTypeNode;
      if (enumNode.variants.length > 0) {
        const variant = enumNode.variants[0];
        if (variant.type.kind === "primitive" && variant.type.name === "()") {
          return variant.name;
        }
        return { [variant.name]: generateValueForType(variant.type) };
      }
      return {};
    }

    case "array":
    case "span": {
      const containerNode = typeNode as ArrayTypeNode | SpanTypeNode;
      return [
        generateValueForType(containerNode.elementType),
        generateValueForType(containerNode.elementType),
      ];
    }

    case "tuple": {
      const tupleNode = typeNode as TupleTypeNode;
      return tupleNode.elements.map((element) => generateValueForType(element));
    }

    default:
      return null;
  }
}

/**
 * Register Monaco completion provider for a specific function
 */
function registerFunctionCompletionProvider(
  monaco: any,
  abi: any[],
  functionName: string,
  languageId: string = "json"
) {
  // Build AST for the specific function
  const { function: funcAst, typeMap } = buildAstForFunction(abi, functionName);

  if (!funcAst) {
    console.error(`Function "${functionName}" not found in the ABI`);
    return;
  }

  // Register completion provider
  monaco.languages.registerCompletionItemProvider(languageId, {
    triggerCharacters: ['"', ".", "{", "["],
    provideCompletionItems: (model: any, position: any) => {
      // Get current context
      const textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      // Try to parse current JSON path
      const path = determineJsonPath(textUntilPosition);

      // For empty document, offer all parameters
      if (!path || path.length === 0) {
        return {
          suggestions: funcAst.inputs.map((input) => {
            const snippet = generateSnippetForType(input.type);
            return {
              label: input.name,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: `"${input.name}": ${snippet}`,
              insertTextRules:
                monaco.languages.CompletionItemRules.InsertAsSnippet,
              detail: `${input.name}: ${input.type.name}`,
              documentation: {
                value: `Parameter of function ${funcAst.name}`,
              },
            };
          }),
        };
      }

      // Find the type for the current path
      let currentType: AbiTypeNode | null = null;
      let currentPath = [...path];

      // If first element is a parameter name, start there
      const paramName = currentPath[0];
      const param = funcAst.inputs.find((p) => p.name === paramName);

      if (param) {
        currentType = param.type;
        currentPath.shift(); // Remove parameter name from path

        // Navigate through the path to find the current type
        for (const segment of currentPath) {
          if (!currentType) break;

          if (currentType.kind === "struct") {
            // Navigate into struct members
            const member = (currentType as StructTypeNode).members.find(
              (m) => m.name === segment
            );
            currentType = member ? member.type : null;
          } else if (currentType.kind === "enum") {
            // Navigate into enum variants
            const variant = (currentType as EnumTypeNode).variants.find(
              (v) => v.name === segment
            );
            currentType = variant ? variant.type : null;
          } else if (
            currentType.kind === "array" ||
            currentType.kind === "span"
          ) {
            // For arrays, use element type (ignore array index)
            if (!isNaN(Number(segment))) {
              currentType = (currentType as ArrayTypeNode | SpanTypeNode)
                .elementType;
            } else {
              currentType = null;
            }
          } else {
            currentType = null;
          }
        }
      }

      // Generate completions based on current type
      if (currentType) {
        return {
          suggestions: generateCompletionItems(currentType, monaco),
        };
      }

      return { suggestions: [] };
    },
  });
}

/**
 * Generate a snippet for a given type
 */
function generateSnippetForType(typeNode: AbiTypeNode): string {
  switch (typeNode.kind) {
    case "primitive":
      if (
        typeNode.name.includes("felt252") ||
        typeNode.name.includes("ClassHash") ||
        typeNode.name.includes("ContractAddress")
      ) {
        return '"0x${1:value}"';
      } else if (typeNode.name.includes("bool")) {
        return "${1|true,false|}";
      } else if (
        typeNode.name.includes("::u") ||
        typeNode.name.includes("::i")
      ) {
        return "${1:0}";
      }
      return '"${1:value}"';

    case "struct": {
      const structNode = typeNode as StructTypeNode;
      const indent = "\t";
      const memberSnippets = structNode.members.map((member, index) => {
        const memberSnippet = generateSnippetForType(member.type);
        return `${indent}"${member.name}": ${memberSnippet}${
          index < structNode.members.length - 1 ? "," : ""
        }`;
      });
      return `{\n${memberSnippets.join("\n")}\n}`;
    }

    case "enum": {
      const enumNode = typeNode as EnumTypeNode;
      if (enumNode.variants.length > 0) {
        // Offer the first variant as default
        const variant = enumNode.variants[0];
        const variantSnippet = generateSnippetForType(variant.type);
        if (variant.type.kind === "primitive" && variant.type.name === "()") {
          // Handle unit types like "()" differently
          return `"${variant.name}"`;
        }
        return `{ "${variant.name}": ${variantSnippet} }`;
      }
      return "{}";
    }

    case "array":
    case "span": {
      const elementType = (typeNode as ArrayTypeNode | SpanTypeNode)
        .elementType;
      const elementSnippet = generateSnippetForType(elementType);
      return `[\n\t${elementSnippet},\n\t${elementSnippet}\n]`;
    }

    case "tuple": {
      const tupleNode = typeNode as TupleTypeNode;
      if (tupleNode.elements.length === 0) {
        return "[]";
      }
      const elementSnippets = tupleNode.elements.map((el) =>
        generateSnippetForType(el)
      );
      return `[${elementSnippets.join(", ")}]`;
    }

    default:
      return '"${1:unknown}"';
  }
}

/**
 * Generate completion items for a type
 */
function generateCompletionItems(typeNode: AbiTypeNode, monaco: any): any[] {
  const CompletionItemKind = monaco.languages.CompletionItemKind;

  switch (typeNode.kind) {
    case "struct": {
      const structNode = typeNode as StructTypeNode;
      return structNode.members.map((member) => {
        const snippet = generateSnippetForType(member.type);
        return {
          label: member.name,
          kind: CompletionItemKind.Field,
          insertText: `"${member.name}": ${snippet}`,
          insertTextRules: monaco.languages.CompletionItemRules.InsertAsSnippet,
          detail: `${member.name}: ${member.type.name}`,
          documentation: {
            value: `Member of struct ${structNode.name}`,
          },
        };
      });
    }

    case "enum": {
      const enumNode = typeNode as EnumTypeNode;
      return enumNode.variants.map((variant) => {
        let insertText;
        if (variant.type.kind === "primitive" && variant.type.name === "()") {
          insertText = `"${variant.name}"`;
        } else {
          const variantSnippet = generateSnippetForType(variant.type);
          insertText = `"${variant.name}": ${variantSnippet}`;
        }

        return {
          label: variant.name,
          kind: CompletionItemKind.EnumMember,
          insertText,
          insertTextRules: monaco.languages.CompletionItemRules.InsertAsSnippet,
          detail: `${variant.name}: ${variant.type.name}`,
          documentation: {
            value: `Variant of enum ${enumNode.name}`,
          },
        };
      });
    }

    case "array":
    case "span": {
      const elementType = (typeNode as ArrayTypeNode | SpanTypeNode)
        .elementType;
      return [
        {
          label: `${typeNode.name} element`,
          kind: CompletionItemKind.Value,
          insertText: generateSnippetForType(elementType),
          insertTextRules: monaco.languages.CompletionItemRules.InsertAsSnippet,
          detail: `Element of ${typeNode.name}`,
          documentation: {
            value: `Array/Span element of type ${elementType.name}`,
          },
        },
      ];
    }

    // For primitive types, just offer a simple completion
    default:
      return [
        {
          label: typeNode.name,
          kind: CompletionItemKind.Value,
          insertText: generateSnippetForType(typeNode),
          insertTextRules: monaco.languages.CompletionItemRules.InsertAsSnippet,
          detail: typeNode.name,
          documentation: {
            value: `Type: ${typeNode.name}`,
          },
        },
      ];
  }
}
