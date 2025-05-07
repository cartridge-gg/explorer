import { compileSchema } from "json-schema-library";

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

interface Method {
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

interface ContentDescriptor {
  name: string;
  summary?: string;
  description?: string
  required?: boolean;
  schema: Schema;
  deprecated?: boolean
}

// interface Schema {
//   name: string;
//   description?: string;
//   summary?: string;
//   params: (Example | Reference)[];
//   result?: Example | Reference;
// }
// TODO: Is there apppropriate type in `json-schema-library`? Otherwise too many type assertions
type Schema = Reference | NumberObject | AllOf | Not<StringObject>

// Used in `starknet_getStorageProof`
interface StringObject {
  type: "string";
  enum?: [
    "pending"
  ],
  description?: string;
  pattern?: string;
}

// Used in `starknet_getTransactionByBlockIdAndIndex`
interface NumberObject {
  title: string;
  type: "number";
  minimum?: number;
}

// Used in `BLOCK_NUMBER`
interface IntegerObject {
  title: string;
  type: "integer";
  minimum?: number;
}

// Used in `BLOCK_BODY_WITH_TX_HASHES`
interface ObjectObject {
  type: "object";
  properties: Record<string, Schema>;
  required?: string[];
}

// Used in`starknet_getEvents`
interface AllOf {
  title: string;
  allOf: Schema[];
}

interface Not<T> {
  not: T
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
  schemas: Record<string, Schema>;
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

export interface Request {
  jsonrpc: "2.0";
  id: number;
  method: string;
  // params?: Pick<JRPCParam, "name" | "value">[];
}

export interface Response {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
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
    const method = this.resolveMethod(m)
    if (!method) return;

    return {
      ...method,
      params: method.params?.map(p => {
        if (OpenRPC.isReference(p.schema)) {
          return {
            ...p,
            component: this.root.getNodeRef(p.schema.$ref)
          }
        }

        if ("oneOf" in p.schema) {
          return {
            ...p,
            oneOf: (p.schema.oneOf as unknown[]).map(o => OpenRPC.isReference(o) ? this.root.getNodeRef(o.$ref) : o)
          }
        }

        return p
      })
    }
  }

  static isReference(val: unknown): val is Reference {
    return typeof val === "object" && val !== null && "$ref" in val;
  }

  static isMethod(val: Method | Reference): val is Method {
    return "name" in val;
  }

  // static isContentDescriptor(val: ContentDescriptor | Reference): val is ContentDescriptor {
  //   return "name" in val;
  // }

  // resolveContentDescriptor(val: ContentDescriptor | Reference): ContentDescriptor | undefined {
  //   if (OpenRPC.isContentDescriptor(val)) {
  //     return val;
  //   }

  //   return this.getComponents(val.$ref);
  // }

  resolveMethod(val: Method | Reference): Method | undefined {
    if (OpenRPC.isMethod(val)) {
      return val;
    }

    return this.root.getNodeRef(val.$ref) as Method | undefined;
  }
}
