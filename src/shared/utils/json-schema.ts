import { JsonSchema } from "json-schema-library";

export function isPrimitive(schema: JsonSchema) {
  if (!("type" in schema)) {
    return false;
  }

  switch (schema.type) {
    case "string":
    case "number":
    case "integer":
    case "boolean":
      return true;
    default:
      return false;
  }
}
