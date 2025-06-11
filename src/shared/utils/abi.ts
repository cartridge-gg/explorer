import { JsonSchema } from "json-schema-library";
import {
  Abi,
  AbiEnum,
  AbiStruct,
  BigNumberish,
  Calldata,
  FunctionAbi,
  InterfaceAbi,
  uint256,
  hash,
} from "starknet";

// TypeNode and related types
export interface PrimitiveType {
  type: "primitive";
  name: string;
}

export interface StructType {
  type: "struct";
  name: string;
  members: Array<[string, TypeNode]>;
}

export interface EnumType {
  type: "enum";
  name: string;
  variants: Array<{ name: string; ty?: string }>;
}

export interface OptionType {
  type: "option";
  name: string;
  elementType: TypeNode;
}

interface ArrayType {
  type: "array";
  name: string;
  elementType: TypeNode;
}

export interface GenericType {
  type: "generic";
  name: string;
  typeArguments: TypeNode[];
}

export interface UnknownType {
  type: "unknown";
  name: string;
}

export type TypeNode =
  | PrimitiveType
  | StructType
  | EnumType
  | OptionType
  | ArrayType
  | GenericType
  | UnknownType;

// Input node for function parameters
export interface ArgumentNode
  extends Pick<FunctionAbi, "name" | "stateMutability" | "state_mutability"> {
  type: TypeNode;
  schema: JsonSchema;
}

export type FunctionInputWithValue = ArgumentNode & {
  value: string;
};

export interface FunctionAbiWithAst extends Omit<FunctionAbi, "inputs"> {
  interface?: string;
  selector: string;
  inputs: ArgumentNode[];
}

export function toJsonSchema(node: TypeNode): JsonSchema {
  switch (node.type) {
    case "primitive":
      return { type: "string", title: node.name };
    case "struct": {
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      node.members.forEach(([name, typeNode]) => {
        properties[name] = toJsonSchema(typeNode);
        if (typeNode.type !== "option") {
          required.push(name);
        }
      });

      return {
        type: "object",
        title: node.name,
        properties,
        required,
        additionalProperties: false,
      };
    }
    case "enum": {
      // Special case for core::bool which is an enum in Cairo
      if (node.name === "core::bool") {
        return { type: "boolean", title: node.name };
      }

      // For enums, we'll represent them as a string with allowed values
      const enumValues = node.variants.map((variant) => variant.name);

      return {
        type: "string",
        enum: enumValues,
        title: node.name,
      };
    }
    case "option": {
      return toJsonSchema(node.elementType);
    }
    case "array":
      return {
        type: "array",
        title: node.name,
        items: toJsonSchema(node.elementType),
      };
    case "generic": {
      // For generics, we'll try to construct a sensible schema based on the type arguments
      if (node.name.includes("Option")) {
        // Handle Option<T> as nullable T
        const innerSchema = toJsonSchema(node.typeArguments[0]) as object;
        return {
          ...innerSchema,
          nullable: true,
        };
      }

      if (node.name.includes("Map") || node.name.includes("Dict")) {
        // Handle Map/Dict as an object with additional properties
        return {
          type: "object",
          additionalProperties:
            node.typeArguments.length > 1
              ? toJsonSchema(node.typeArguments[1])
              : true,
        };
      }

      // Default handling for other generic types
      return {
        type: "object",
        title: node.name,
      };
    }
    case "unknown":
    default:
      return { type: "object", title: node.name };
  }
}

/**
 * Builds type registries for structs and enums from the ABI
 */
function buildTypeRegistries(
  abi: Abi,
): [Map<string, AbiStruct>, Map<string, AbiEnum>] {
  const structRegistry = new Map<string, AbiStruct>();
  const enumRegistry = new Map<string, AbiEnum>();

  for (const item of abi) {
    if (item.type === "struct") {
      structRegistry.set(item.name, item);
    } else if (item.type === "enum") {
      enumRegistry.set(item.name, item);
    }
  }

  return [structRegistry, enumRegistry];
}

export function toCalldata(node: TypeNode, value: unknown): Calldata {
  switch (node.type) {
    case "primitive": {
      switch (node.name) {
        case "core::integer::u256": {
          const { low, high } = uint256.bnToUint256(value as BigNumberish);
          return [low.toString(), high.toString()];
        }
        // case "core::integer::u512":
        case "core::felt252":
        case "core::integer::u8":
        case "core::integer::u16":
        case "core::integer::u32":
        case "core::integer::u64":
        case "core::integer::u128":
        case "core::starknet::class_hash::ClassHash":
        default:
          return [value as string];
      }
    }
    case "struct": {
      const _value = typeof value === "string" ? JSON.parse(value) : value;
      return node.members.flatMap(([memberName, memberType]) =>
        toCalldata(memberType, _value[memberName]),
      );
    }
    case "enum":
      return node.name === "core::bool" ? (value ? ["1"] : ["0"]) : [];
    case "option":
      return value ? ["0", ...toCalldata(node.elementType, value)] : ["1"];
    case "array": {
      const _value = value as unknown[];
      const arrayLength = BigInt(_value.length);
      return [
        arrayLength.toString(),
        ..._value.flatMap((elem: unknown) =>
          toCalldata(node.elementType, elem),
        ),
      ];
    }
    case "generic":
    case "unknown":
    default:
      return [];
  }
}

export function parseAbi(abi: Abi) {
  let constructor: FunctionAbiWithAst;
  const functions: FunctionAbiWithAst[] = [];
  const parse = parseFunctionCreator(abi);

  abi.forEach((item) => {
    switch (item.type) {
      case "constructor": {
        constructor = parse(item);
        break;
      }
      case "function": {
        functions.push(parse(item));
        break;
      }
      case "interface": {
        (item as InterfaceAbi).items.forEach((item2) => {
          if (item2.type !== "function") return;
          functions.push({ ...parse(item2), interface: item.name });
        });
        break;
      }
      default:
        break;
    }
  });

  return {
    constructor: constructor!,
    readFuncs: functions.filter(isReadFunction),
    writeFuncs: functions.filter((f) => !isReadFunction(f)),
  };
}

/**
 * Return function to parse function's inputs and return with JSON schema
 */
function parseFunctionCreator(abi: Abi) {
  const [structRegistry, enumRegistry] = buildTypeRegistries(abi);
  return (func: FunctionAbi): FunctionAbiWithAst => ({
    ...func,
    selector: hash.getSelectorFromName(func.name),
    inputs: func.inputs.map((input) => {
      const type = resolveType(input.type, structRegistry, enumRegistry);
      return {
        name: input.name,
        type,
        schema: toJsonSchema(type),
      };
    }),
  });
}

/**
 * Resolves the type string to a TypeNode with appropriate nesting
 */
function resolveType(
  typeStr: string,
  structRegistry: Map<string, AbiStruct>,
  enumRegistry: Map<string, AbiEnum>,
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
              name: structDef.name,
              elementType: resolveType(
                elementType,
                structRegistry,
                enumRegistry,
              ),
            };
          }
        }
      }

      // If we couldn't determine the element type, create a generic array type
      return {
        type: "array",
        name: structDef.name,
        elementType: {
          type: "primitive",
          name: "felt252", // Default element type
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
      name: structDef.name,
      members,
    };
  }

  // Check if it's an enum
  if (enumRegistry.has(typeStr)) {
    const enumDef = enumRegistry.get(typeStr)!;

    if (enumDef.name.startsWith("core::option::Option")) {
      // Option enum MUST have a 'Some' variant
      const some_type = enumDef.variants.find(
        (variant) => variant.name === "Some",
      );

      if (!some_type) {
        throw new Error("Option enum must have a 'Some' variant");
      }

      return {
        type: "option",
        name: enumDef.name,
        elementType: resolveType(some_type.type, structRegistry, enumRegistry),
      };
    }

    return {
      type: "enum",
      name: enumDef.name,
      variants: [...enumDef.variants],
    };
  }

  // Special case for arrays like core::array::Array::<core::felt252>
  if (
    (typeStr.includes("core::array::Array") ||
      typeStr.includes("core::array::Span")) &&
    typeStr.includes("<") &&
    typeStr.endsWith(">")
  ) {
    // Extract the element type from the generic parameter
    const startIdx = typeStr.indexOf("<") + 1;
    const endIdx = typeStr.lastIndexOf(">");
    const elementType = typeStr.substring(startIdx, endIdx);

    return {
      type: "array",
      name: elementType,
      elementType: resolveType(elementType, structRegistry, enumRegistry),
    };
  }

  // Default to primitive type
  return {
    type: "primitive",
    name: typeStr,
  };
}

export function isReadFunction(func: FunctionAbiWithAst) {
  return (
    func.state_mutability === "view" ||
    func.state_mutability === "pure" ||
    func.stateMutability === "view" ||
    func.stateMutability === "pure"
  );
}
