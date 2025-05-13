import { compileSchema, JsonSchema } from "json-schema-library";
import { SchemaNode } from "json-schema-library";

// https://spec.open-rpc.org/#openrpc-object
export interface IOpenRPC {
  // openrpc: string;
  // info: Info;
  // servers?: Server[];
  methods: (Method /* | Reference */)[];
  components?: Components;
  // externalDocs?: ExternalDocumentation;
}

// interface Info {
//   title: string;
//   description?: string;
//   termsOfService?: string;
//   contact?: Contact;
//   license?: License;
//   version: string;
// }
// interface Contact {
//   name?: string;
//   url?: string;
//   email?: string;
// }

// interface License {
//   name: string;
//   url?: string;
// }

// interface Server {
//   name: string;
//   url: RuntimeExpression;
//   summary?: string;
//   description?: string;
//   variables: Record<string, ServerVariable>
// }

// interface ServerVariable {
//   enum?: string[];
//   default: string;
//   description?: string;
// }

export interface Method {
  name: string;
  // tags?: (Tag | Reference)[]
  summary?: string;
  description?: string;
  // externalDocs?: ExternalDocumentation;
  params: (ContentDescriptor /* | Reference */)[];
  // result: ContentDescriptor | Reference;
  // deprecated?: boolean;
  // servers?: Server[];
  // errors?: (Error | Reference)[];
  // links?: (Link | Reference)[];
  // paramStructure?: "by-name" | "by-position" | "either";
  // examples?: (ExamplePairing | Reference)[];
}

export interface ContentDescriptor {
  name: string;
  summary?: string;
  description?: string
  required?: boolean;
  schema: JsonSchema | Reference;
  deprecated?: boolean
}

// interface ExamplePairing {
//   name: string;
//   description?: string;
//   summary?: string;
//   params: (Example | Reference)[];
//   result: Example | Reference;
// }

// interface Example {
//   name?: string;
//   summary?: string;
//   description?: string;
//   value?: unknown;
//   externalValue?: string;
// }

// interface Link {
//   name: string;
//   description?: string;
//   summary?: string;
//   method?: string;
//   params?: Record<string, unknown | RuntimeExpression>;
//   server?: Server;
// }

// type RuntimeExpression = unknown;

interface Components {
  // contentDescriptors?: Record<string, ContentDescriptor>;
  schemas: Record<string, JsonSchema>;
  // examples?: Record<string, Example>;
  // links?: Record<string, Link>;
  // errors?: Record<string, Error>;
  // examplePairings?: Record<string, ExamplePairing>;
  // tags?: Record<string, Tag>;
}

// interface Tag {
//   name: string;
//   summary?: string;
//   description?: string;
//   externalDocs?: ExternalDocumentation;
// }

// interface ExternalDocumentation {
//   description?: string;
//   url: string;
// }

interface Reference {
  $ref: string;
}

export class OpenRPC {
  readonly schema: IOpenRPC;
  readonly root: SchemaNode;

  constructor(schema: IOpenRPC) {
    this.schema = schema;
    this.root = compileSchema(schema)
  }

  static async fromUrl(url: string) {
    const response = await fetch(url);
    const data = await response.json() as IOpenRPC;
    return new OpenRPC(data)
  }

  getMethodList() {
    return this.schema.methods.map(m => this.getMethod(m.name)).filter(m => m !== undefined)
  }

  getMethod(nameOrIndex: string | number) {
    const m = typeof nameOrIndex === "string" ? this.schema.methods.find(m => {
      if (!("name" in m)) {
        return false;
      }

      return m.name === nameOrIndex
    }) : this.schema.methods[nameOrIndex]
    if (!m) return;
    const method = {
      ...m,
      params: m.params.map(
        p => ({
          ...p,
          schema: OpenRPC.resolveReference(p.schema, this.root)
        })
      )
    }
    return method
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static resolveReference(schema: JsonSchema | Reference, root: SchemaNode): any {
    if (OpenRPC.isReference(schema)) {
      return OpenRPC.resolveReference(root.getNodeRef(schema.$ref)!.schema as JsonSchema, root)
    }

    switch (schema.type) {
      case "object":
        return {
          ...schema,
          properties: Object.entries(schema.properties).reduce(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (acc: any, [key, p]: any) => {
              return {...acc, [key]: OpenRPC.resolveReference(p, root)}
            },
            schema.properties
          )
        }
      case "array":
        return {
          ...schema,
          items: OpenRPC.resolveReference(schema.items, root)
        }
      default:
        if ("oneOf" in schema) {
          return {
            ...schema,
            oneOf: schema.oneOf.map((s: JsonSchema) => OpenRPC.resolveReference(s, root))
          }
        } else if ("allOf" in schema) {
          return {
            ...schema,
            allOf: schema.allOf.map((s: JsonSchema) => OpenRPC.resolveReference(s, root))
          }
        }
        return schema
    }
  }

  static isReference(val: unknown): val is Reference {
    return typeof val === "object" && val !== null && "$ref" in val;
  }
}
