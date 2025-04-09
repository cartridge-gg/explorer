use cairo_lang_starknet_classes::abi::{Contract, Function, Item};
use cairo_lang_starknet_classes::abi::{Enum, EnumVariant, Struct};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Represents a primitive type like core::felt252, u32, etc.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrimitiveType {
    pub name: String,
}

/// Represents a struct type with its members
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StructType {
    pub name: String,
    pub members: Vec<(String, TypeNode)>,
}

/// Represents an enum type with its variants
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnumType {
    pub name: String,
    pub variants: Vec<EnumVariant>,
}

/// Represents an array type with its element type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArrayType {
    pub element_type: Box<TypeNode>,
}

/// Represents a generic type like Option<T>, etc.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenericType {
    pub name: String,
    pub type_arguments: Vec<Box<TypeNode>>,
}

/// Represents an unknown type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnknownType {
    pub name: String,
}

/// Represents different kinds of types in the AST
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum TypeNode {
    /// Simple types like core::felt252, u32, etc.
    #[serde(rename = "primitive")]
    Primitive(PrimitiveType),
    /// Struct types with their members
    #[serde(rename = "struct")]
    Struct(StructType),
    /// Enum types with their variants
    #[serde(rename = "enum")]
    Enum(EnumType),
    /// Array type with element type
    #[serde(rename = "array")]
    Array(ArrayType),
    /// Generic types like Option<T>, etc.
    #[serde(rename = "generic")]
    Generic(GenericType),
    /// When the type couldn't be resolved
    #[serde(rename = "unknown")]
    Unknown(UnknownType),
}

/// Represents a function input parameter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InputNode {
    pub name: String,
    #[serde(rename = "type")]
    pub ty: TypeNode,
}

/// Function AST representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionAst {
    pub name: String,
    pub inputs: Vec<InputNode>,
}

/// Builds type registries for structs and enums from the ABI
fn build_type_registries(abi_items: &[Item]) -> (HashMap<String, Struct>, HashMap<String, Enum>) {
    let mut struct_registry: HashMap<String, Struct> = HashMap::new();
    let mut enum_registry: HashMap<String, Enum> = HashMap::new();

    for item in abi_items {
        match item {
            Item::Struct(s) => {
                struct_registry.insert(s.name.clone(), s.clone());
            }
            Item::Enum(e) => {
                enum_registry.insert(e.name.clone(), e.clone());
            }
            _ => {}
        }
    }

    (struct_registry, enum_registry)
}

/// Builds an abstract syntax tree for a function's inputs
pub fn getFunctionAst(abi: Contract, function_name: &str) -> Option<FunctionAst> {
    let abi_items = abi.into_iter().collect::<Vec<Item>>();
    let (struct_registry, enum_registry) = build_type_registries(&abi_items);

    // Find the function in the ABI
    let function: &Function = abi_items.iter().find_map(|item| match item {
        Item::Function(func) if func.name == function_name => Some(func),
        Item::Interface(interface) => interface.items.iter().find_map(|item| match item {
            Item::Function(func) if func.name == function_name => Some(func),
            _ => None,
        }),
        _ => None,
    })?;

    // Parse the inputs
    let inputs = function
        .inputs
        .iter()
        .map(|input| InputNode {
            name: input.name.clone(),
            ty: resolve_type(&input.ty, &struct_registry, &enum_registry),
        })
        .collect();

    Some(FunctionAst {
        name: function.name.clone(),
        inputs,
    })
}

/// Resolves the type string to a TypeNode with appropriate nesting
fn resolve_type(
    type_str: &str,
    struct_registry: &HashMap<String, Struct>,
    enum_registry: &HashMap<String, Enum>,
) -> TypeNode {
    // Check if it's a struct
    if let Some(struct_def) = struct_registry.get(type_str) {
        let mut members = Vec::with_capacity(struct_def.members.len());

        for member in &struct_def.members {
            let name = member.name.clone();
            let r#type = resolve_type(&member.ty, struct_registry, enum_registry);
            members.push((name, r#type));
        }

        return TypeNode::Struct(StructType {
            name: struct_def.name.clone(),
            members,
        });
    }

    // Check if it's an enum
    if let Some(enum_def) = enum_registry.get(type_str) {
        return TypeNode::Enum(EnumType {
            name: enum_def.name.clone(),
            variants: enum_def.variants.clone(),
        });
    }

    // Special case for arrays like core::array::Array::<core::felt252>
    if type_str.contains("core::array::Array") && type_str.contains("<") && type_str.ends_with(">")
    {
        // Extract the element type from the generic parameter
        let start_idx = type_str.find("<").unwrap() + 1;
        let end_idx = type_str.rfind(">").unwrap();
        let element_type = &type_str[start_idx..end_idx];

        return TypeNode::Array(ArrayType {
            element_type: Box::new(resolve_type(element_type, struct_registry, enum_registry)),
        });
    }

    TypeNode::Primitive(PrimitiveType {
        name: type_str.to_string(),
    })
}

const ABI: &str = include_str!("abi.json");

#[test]
fn test_resolve_type() {
    let abi = serde_json::from_str::<Contract>(ABI).unwrap();
    let ast = getFunctionAst(abi, "is_valid_signature");
    println!("{}", serde_json::to_string_pretty(&ast).unwrap())
}
