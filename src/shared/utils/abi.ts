import {
  Abi,
  AbiEnum,
  AbiStruct,
  Calldata,
  FunctionAbi,
  InterfaceAbi,
} from "starknet";

export type AbiEnumVariant = {
  name: string;
  type: string;
};

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

export interface OptionType {
  name: string;
  element_type: TypeNode;
}

interface ArrayType {
  name: string;
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
  | { type: "option"; value: OptionType }
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
    case "option":
      console.log("option element type", type.value.element_type);
      return createJsonSchemaFromTypeNode(type.value.element_type);
    case "array":
      return createArraySchema(type.value);
    case "generic":
      return createGenericSchema(type.value);
    case "unknown":
    default:
      return { type: "object", title: type.value.name };
  }
}

function createPrimitiveSchema(primitive: PrimitiveType): any {
  return { type: "string", title: primitive.name };
}

function createStructSchema(struct: StructType): any {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  struct.members.forEach(([name, typeNode]) => {
    properties[name] = createJsonSchemaFromTypeNode(typeNode);
    if (typeNode.type !== "option") {
      required.push(name);
    }
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
    return { type: "boolean", title: enumType.name };
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
    title: array.name,
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
): [Map<string, AbiStruct>, Map<string, AbiEnum>] {
  const structRegistry = new Map<string, AbiStruct>();
  const enumRegistry = new Map<string, AbiEnum>();

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

/**
 * Resolves the type string to a TypeNode with appropriate nesting
 */
function resolveType(
  typeStr: string,
  structRegistry: Map<string, AbiStruct>,
  enumRegistry: Map<string, AbiEnum>
): TypeNode {
  // Check if it's a struct
  if (structRegistry.has(typeStr)) {
    const structDef = structRegistry.get(typeStr)!;

    // Check if the struct name starts with core::array::Span, if so, treat it like an array
    //
    // Example:
    // {
    //     "type": "struct",
    //     "name": "core::array::Span::<core::felt252>",
    //     "members": [
    //         {
    //             "name": "snapshot",
    //             "type": "@core::array::Array::<core::felt252>"
    //         }
    //     ]
    // }
    if (structDef.name.startsWith("core::array::Span")) {
      // Try to extract the element type from the struct's members
      // Typically, spans have an "element" field or similar
      for (const member of structDef.members) {
        if (member.name === "snapshot") {
          if (member.type.includes("@core::array::Array")) {
            const startIdx = member.type.indexOf("<") + 1;
            const endIdx = member.type.lastIndexOf(">");
            const elementType = member.type.substring(startIdx, endIdx);

            return {
              type: "array",
              value: {
                name: structDef.name,
                element_type: resolveType(
                  elementType,
                  structRegistry,
                  enumRegistry
                ),
              },
            };
          }
        }
      }

      // If we couldn't determine the element type, create a generic array type
      return {
        type: "array",
        value: {
          name: structDef.name,
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

    if (enumDef.name.startsWith("core::option::Option")) {
      // Option enum MUST have a 'Some' variant
      const some_type = enumDef.variants.find(
        (variant) => variant.name === "Some"
      );

      if (!some_type) {
        throw new Error("Option enum must have a 'Some' variant");
      }

      const element_type = resolveType(
        some_type.type,
        structRegistry,
        enumRegistry
      );

      return {
        type: "option",
        value: {
          name: enumDef.name,
          element_type,
        },
      };
    }

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
        name: elementType,
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

export function convertToCalldata(type: TypeNode, value: any): Calldata {
  switch (type.type) {
    case "primitive":
      return convertPrimitiveToCalldata(type.value, value as string);
    case "struct":
      return convertStructToCalldata(
        type.value,
        typeof value === "string" ? JSON.parse(value) : value
      );
    case "enum":
      return convertEnumToCalldata(type.value, value);
    case "option":
      return convertOptionToCalldata(type.value, value);
    case "array":
      return convertArrayToCalldata(type.value, value as any[]);
    case "generic":
    case "unknown":
    default:
      return [];
  }
}

function convertStructToCalldata(type: StructType, value: any): Calldata {
  let calldata: Calldata = [];
  console.log("struct value", value);

  type.members.forEach(([memberName, memberType]) => {
    const memberValue = value[memberName];
    const memberCalldata = convertToCalldata(memberType, memberValue);
    calldata = calldata.concat(memberCalldata);
  });

  console.log("type", type, calldata);

  return calldata;
}

function convertArrayToCalldata(type: ArrayType, value: any[]): Calldata {
  let calldata: Calldata = [];
  const arrayLength = BigInt(value.length);
  calldata.push(arrayLength.toString());

  value.forEach((elem) => {
    console.log("element_type", type.element_type, "elem", elem);
    const elemCalldata = convertToCalldata(type.element_type, elem);
    console.log("elemcalldata", elemCalldata);
    calldata = calldata.concat(elemCalldata);
  });

  return calldata;
}

function convertEnumToCalldata(type: EnumType, value: any): Calldata {
  if (type.name === "core::bool") {
    return convertBooleanToCalldata(value as boolean);
  } else {
    return [];
  }
}

function convertOptionToCalldata(type: OptionType, value: any): Calldata {
  if (value) {
    return ["0", ...convertToCalldata(type.element_type, value)];
  } else {
    return ["1"];
  }
}

function convertBooleanToCalldata(value: boolean): Calldata {
  return value ? ["1"] : ["0"];
}

function convertPrimitiveToCalldata(
  type: PrimitiveType,
  value: string
): Calldata {
  switch (type.name) {
    case "core::integer::u256": {
      const num = BigInt(value);
      const mask = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"); // 2^128
      const low = (num & mask).toString();
      const high = (num >> BigInt(128)).toString();
      return [low, high];
    }
    // case "core::felt252":
    // case "core::integer::u8":
    // case "core::integer::u16":
    // case "core::integer::u32":
    // case "core::integer::u64":
    // case "core::integer::u128":
    // case "core::starknet::class_hash::ClassHash":
    default:
      return [value];
  }
}
