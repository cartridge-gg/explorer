import { Abi, AbiStruct, FunctionAbi, InterfaceAbi } from "starknet";
import { editor, languages, Position } from "monaco-editor";

// TypeNode and related types
export interface PrimitiveType {
  name: string;
}

export interface StructType {
  name: string;
  members: Array<[string, TypeNode]>;
}

export interface EnumType {
  name: string;
  variants: Array<{ name: string; ty?: string }>;
}

interface ArrayType {
  element_type: TypeNode;
}

export interface GenericType {
  name: string;
  type_arguments: Array<TypeNode>;
}

export interface UnknownType {
  name: string;
}

export type TypeNode =
  | { type: "primitive"; value: PrimitiveType }
  | { type: "struct"; value: StructType }
  | { type: "enum"; value: EnumType }
  | { type: "array"; value: ArrayType }
  | { type: "generic"; value: GenericType }
  | { type: "unknown"; value: UnknownType };

// Input node for function parameters
export interface InputNode {
  name: string;
  type: TypeNode;
}

// Function AST representation
export interface FunctionAst {
  name: string;
  inputs: Array<InputNode>;
}

export function createJsonSchemaFromTypeNode(type: TypeNode): any {
  switch (type.type) {
    case "primitive":
      return createPrimitiveSchema(type.value);
    case "struct":
      return createStructSchema(type.value);
    case "enum":
      return createEnumSchema(type.value);
    case "array":
      return createArraySchema(type.value);
    case "generic":
      return createGenericSchema(type.value);
    case "unknown":
      return { type: "object" }; // Default to object for unknown types
    default:
      return { type: "object" };
  }
}

function createPrimitiveSchema(primitive: PrimitiveType): any {
  // Map Starknet/Cairo primitive types to JSON schema types
  switch (primitive.name) {
    case "core::felt252":
    case "core::integer::u8":
    case "core::integer::u16":
    case "core::integer::u32":
    case "core::integer::u64":
    case "core::integer::u128":
    case "core::integer::u256":
      return { type: "integer" };
    // In Cairo, core::bool is considered as an enum, not a primitive boolean
    default:
      return { type: "string" }; // Default to string for unknown primitives
  }
}

function createStructSchema(struct: StructType): any {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  struct.members.forEach(([name, typeNode]) => {
    properties[name] = createJsonSchemaFromTypeNode(typeNode);
    required.push(name);
  });

  return {
    type: "object",
    title: struct.name,
    properties,
    required,
    additionalProperties: false,
  };
}

function createEnumSchema(enumType: EnumType): any {
  // Special case for core::bool which is an enum in Cairo
  if (enumType.name === "core::bool") {
    return { type: "boolean" };
  }

  // For enums, we'll represent them as a string with allowed values
  const enumValues = enumType.variants.map((variant) => variant.name);

  return {
    type: "string",
    enum: enumValues,
    title: enumType.name,
  };
}

function createArraySchema(array: ArrayType): any {
  return {
    type: "array",
    items: createJsonSchemaFromTypeNode(array.element_type),
  };
}

function createGenericSchema(generic: GenericType): any {
  // For generics, we'll try to construct a sensible schema based on the type arguments
  if (generic.name.includes("Option")) {
    // Handle Option<T> as nullable T
    const innerSchema = createJsonSchemaFromTypeNode(generic.type_arguments[0]);
    return {
      ...innerSchema,
      nullable: true,
    };
  }

  if (generic.name.includes("Map") || generic.name.includes("Dict")) {
    // Handle Map/Dict as an object with additional properties
    return {
      type: "object",
      additionalProperties:
        generic.type_arguments.length > 1
          ? createJsonSchemaFromTypeNode(generic.type_arguments[1])
          : true,
    };
  }

  // Default handling for other generic types
  return {
    type: "object",
    title: generic.name,
  };
}

/**
 * Builds type registries for structs and enums from the ABI
 */
function buildTypeRegistries(
  abi: Abi
): [Map<string, AbiStruct>, Map<string, any>] {
  const structRegistry = new Map<string, AbiStruct>();
  const enumRegistry = new Map<string, any>();

  // console.log("abi", abi);
  for (const item of abi) {
    if (item.type === "struct") {
      structRegistry.set(item.name, item);
    } else if (item.type === "enum") {
      enumRegistry.set(item.name, item);
    }
  }

  return [structRegistry, enumRegistry];
}

/**
 * Builds an abstract syntax tree for a function's inputs
 */
export function getFunctionAst(
  abi: Abi,
  functionName: string
): FunctionAst | null {
  const [structRegistry, enumRegistry] = buildTypeRegistries(abi);
  const targetFunction = findFunctionInAbi(abi, functionName);

  if (!targetFunction) {
    return null;
  }

  // Parse the inputs
  const inputs = targetFunction.inputs.map((input) => ({
    name: input.name,
    type: resolveType(input.type, structRegistry, enumRegistry),
  }));

  return {
    name: targetFunction.name,
    inputs,
  };
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

export function getMonacoCompletionItems(
  input: InputNode,
  model: editor.ITextModel,
  position: Position
): languages.CompletionList {
  // find out if we are completing a property in the 'dependencies' object.
  const textUntilPosition = model.getValueInRange({
    startLineNumber: 1,
    startColumn: 1,
    endLineNumber: position.lineNumber,
    endColumn: position.column,
  });

  const word = model.getWordUntilPosition(position);
  const range = {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: word.startColumn,
    endColumn: word.endColumn,
  };

  if (input.type.type === "array") {
    return { suggestions: [] };
  }

  if (input.type.type === "struct") {
    const param1 = textUntilPosition.match(
      /\s*\{\s*("[^"]*"\s*:\s*"[^"]*"\s*,\s*)*([^"]*)?$/
    );

    if (!param1) {
      return { suggestions: [] };
    }

    const suggestions: languages.CompletionItem[] = [];

    input.type.value.members.forEach(([memberName, memberType]) => {
      // Check if the member name already exists in the current object
      const memberRegex = new RegExp(`"${memberName}"\\s*:`);

      // If the member already exists in the text, don't add it to suggestions
      if (textUntilPosition.match(memberRegex)) {
        return;
      }

      // Re-use the existing regex to ensure we're inside an object
      const param = textUntilPosition.match(
        /\s*\{\s*("[^"]*"\s*:\s*"[^"]*"\s*,\s*)*([^"]*)?$/
      );

      // Only add suggestion if we're inside curly braces
      if (!param) {
        return;
      }

      const insertText =
        memberType.type === "struct"
          ? `"${memberName}": {\n\t\n}`
          : memberType.type === "array"
          ? `"${memberName}": [\n\t\n]`
          : `"${memberName}": `;

      suggestions.push({
        label: memberName,
        kind: languages.CompletionItemKind.Function,
        insertText,
        range: range,
      });
    });

    return { suggestions };
  }

  return {
    suggestions: [],
  };
}

/**
 * Resolves the type string to a TypeNode with appropriate nesting
 */
function resolveType(
  typeStr: string,
  structRegistry: Map<string, AbiStruct>,
  enumRegistry: Map<string, any>
): TypeNode {
  // Check if it's a struct
  if (structRegistry.has(typeStr)) {
    const structDef = structRegistry.get(typeStr)!;

    // Check if the struct name starts with core::array::Span, if so, treat it like an array
    if (structDef.name.startsWith("core::array::Span")) {
      // Try to extract the element type from the struct's members
      // Typically, spans have an "element" field or similar
      for (const member of structDef.members) {
        if (member.name === "element" || member.name === "elements") {
          return {
            type: "array",
            value: {
              element_type: resolveType(
                member.type,
                structRegistry,
                enumRegistry
              ),
            },
          };
        }
      }

      // If we couldn't determine the element type, create a generic array type
      return {
        type: "array",
        value: {
          element_type: {
            type: "primitive",
            value: { name: "felt252" }, // Default element type
          },
        },
      };
    }

    const members: Array<[string, TypeNode]> = [];

    for (const member of structDef.members) {
      const name = member.name;
      const type = resolveType(member.type, structRegistry, enumRegistry);
      members.push([name, type]);
    }

    return {
      type: "struct",
      value: {
        name: structDef.name,
        members,
      },
    };
  }

  // Check if it's an enum
  if (enumRegistry.has(typeStr)) {
    const enumDef = enumRegistry.get(typeStr)!;

    return {
      type: "enum",
      value: {
        name: enumDef.name,
        variants: [...enumDef.variants],
      },
    };
  }

  // Special case for arrays like core::array::Array::<core::felt252>
  if (
    typeStr.includes("core::array::Array") &&
    typeStr.includes("<") &&
    typeStr.endsWith(">")
  ) {
    // Extract the element type from the generic parameter
    const startIdx = typeStr.indexOf("<") + 1;
    const endIdx = typeStr.lastIndexOf(">");
    const elementType = typeStr.substring(startIdx, endIdx);

    return {
      type: "array",
      value: {
        element_type: resolveType(elementType, structRegistry, enumRegistry),
      },
    };
  }

  // Special case for spans like core::array::Span::<core::felt252>
  if (
    typeStr.includes("core::array::Span") &&
    typeStr.includes("<") &&
    typeStr.endsWith(">")
  ) {
    // Extract the element type from the generic parameter
    const startIdx = typeStr.indexOf("<") + 1;
    const endIdx = typeStr.lastIndexOf(">");
    const elementType = typeStr.substring(startIdx, endIdx);

    return {
      type: "array",
      value: {
        element_type: resolveType(elementType, structRegistry, enumRegistry),
      },
    };
  }

  // Default to primitive type
  return {
    type: "primitive",
    value: {
      name: typeStr,
    },
  };
}

export function provideCompletionItems(
  model: editor.ITextModel,
  position: Position
): languages.CompletionList {
  // find out if we are completing a property in the 'dependencies' object.
  const textUntilPosition = model.getValueInRange({
    startLineNumber: 1,
    startColumn: 1,
    endLineNumber: position.lineNumber,
    endColumn: position.column,
  });

  const word = model.getWordUntilPosition(position);
  const range = {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: word.startColumn,
    endColumn: word.endColumn,
  };

  const param1 = textUntilPosition.match(
    /"dependencies"\s*:\s*\{\s*("[^"]*"\s*:\s*"[^"]*"\s*,\s*)*([^"]*)?$/
  );

  if (param1) {
    return {
      suggestions: createDependencyProposals(range),
    };
  }

  const param2 = textUntilPosition.match(
    /"foo"\s*:\s*\{\s*("[^"]*"\s*:\s*"[^"]*"\s*,\s*)*([^"]*)?$/
  );

  if (param2) {
    return {
      suggestions: [
        {
          label: '"ass"',
          kind: languages.CompletionItemKind.Field,
          insertText: '"ass": {\n\t\n}',
          range: range,
        },
      ],
    };
  }

  return {
    suggestions: [],
  };
}

function createDependencyProposals(range): languages.CompletionItem[] {
  // returning a static list of proposals, not even looking at the prefix (filtering is done by the Monaco editor),
  // here you could do a server side lookup
  return [
    {
      label: '"lodash"',
      kind: languages.CompletionItemKind.Function,
      documentation: "The Lodash library exported as Node.js modules.",
      insertText: '"lodash": "*"',
      range: range,
    },
    {
      label: '"express"',
      kind: languages.CompletionItemKind.Function,
      documentation: "Fast, unopinionated, minimalist web framework",
      insertText: '"express": "*"',
      range: range,
    },
    {
      label: '"mkdirp"',
      kind: languages.CompletionItemKind.Function,
      documentation: "Recursively mkdir, like <code>mkdir -p</code>",
      insertText: '"mkdirp": "*"',
      range: range,
    },
    {
      label: '"my-third-party-library"',
      kind: languages.CompletionItemKind.Function,
      documentation: "Describe your library here",
      insertText: '"${1:my-third-party-library}": "${2:1.2.3}"',
      insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: range,
    },
  ];
}
