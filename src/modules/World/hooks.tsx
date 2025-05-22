import { useQuery } from "@tanstack/react-query";
import { Graffle } from "graffle";
import { useEffect, useMemo, useState } from "react";

export function useWorld() {
  const [form, setForm] = useState<{
    project: string;
    model: string | undefined;
  }>({
    project: "pistols-mainnet",
    model: undefined,
  });

  const { data: deployments } = useQuery({
    queryKey: ["deployments"],
    queryFn: async () => {
      const graffle = Graffle.create().transport({
        url: "https://api.cartridge.gg/query",
      });
      const res = await graffle.gql`
        query {
          deployments (where: { serviceID: "torii", status: active }) {
            edges {
              node {
                project
              }
            }
          }
        }
      `.send();
      const deployments = res?.deployments.edges.map(
        ({ node }) => node.project,
      );
      return deployments;
    },
  });

  const graffle = useMemo(
    () =>
      Graffle.create().transport({
        url: `https://api.cartridge.gg/x/${form.project}/torii/graphql`,
      }),
    [form.project],
  );

  const { data: schema } = useQuery({
    queryKey: ["world", form.project, "schema"],
    queryFn: async () => {
      console.log("fetching schema");
      const res = await graffle.gql`
        ${fullTypeFragment}

        query {
          __schema {
            queryType {
              ...FullType
            }
            types {
              ...FullType
            }
          }
        }
      `.send();
      return res.__schema;
    },
  });

  const { data: models } = useQuery({
    queryKey: ["world", form.project, "models"],
    queryFn: async () => {
      const res = await graffle.gql`
        query {
          models {
            edges {
              node {
                id
                name
                namespace
                classHash
                contractAddress
                # transactionHash
                createdAt
                executedAt
              }
            }
          }
        }
      `.send();
      return res?.models.edges.map(({ node }) => node);
    },
    enabled: !!schema,
  });

  useEffect(() => {
    if (!models || form.model) return;
    setForm((form) => ({ ...form, model: models[0]?.name }));
  }, [form, models]);

  /**
   * Example:
   * query  {
   *   dopewarsGameCreatedModels {
   *     edges {
   *       node {
   *         game_id
   *       }
   *     }
   *   }
   * }
   */
  const { data: model } = useQuery({
    queryKey: ["world", form.project, "model", form.model],
    queryFn: async () => {
      const m = models?.find((m) => m.name === form.model);
      const queryName = `${m.namespace}${m.name}Models`;
      const queryType = schema?.queryType.fields.find(
        (f) => f.name === queryName,
      );
      const typeName = queryType.type.name.replace("Connection", "");
      const fields = schema.types
        .find((t) => t.name === typeName)
        .fields.filter((f) => !["entity", "eventMessage"].includes(f.name))
        .map((f) => resolveFieldType(schema, f));

      const res = await graffle.gql`
        query {
          ${queryName} {
            edges {
              node {
                ${toQuery(fields)}
              }
            }
          }
        }
      `.send();

      return res[queryName].edges.map(({ node }) => node);
    },
    enabled: !!schema && !!models && !!form.model,
  });

  return {
    deployments,
    schema,
    models,
    model,
    form,
    setForm,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveFieldType(schema: any, field: any) {
  switch (field.type.kind) {
    case "OBJECT": {
      const t = schema.types.find((t) => t.name === field.type.name);
      if (!t) {
        throw new Error(`Type ${field.type.name} not found`);
      }
      return {
        ...field,
        type: {
          ...t,
          fields: t.fields.map((f) => resolveFieldType(schema, f)),
        },
      };
    }
    default:
      return field;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toQuery(fields: any) {
  return fields.reduce((acc, f) => {
    switch (f.type.kind) {
      case "OBJECT":
        return `${acc}\n${f.name} {\n${toQuery(f.type.fields)}\n}`;
      default:
        return `${acc}\n${f.name}`;
    }
  }, "");
}

const fullTypeFragment = `
  fragment FullType on __Type {
    kind
    name
    fields(includeDeprecated: true) {
      name
      args {
        ...InputValue
      }
      type {
        ...TypeRef
      }
      isDeprecated
      deprecationReason
    }
    inputFields {
      ...InputValue
    }
    interfaces {
      ...TypeRef
    }
    enumValues(includeDeprecated: true) {
      name
      description
      isDeprecated
      deprecationReason
    }
    possibleTypes {
      ...TypeRef
    }
  }

  fragment InputValue on __InputValue {
    name
    type {
      ...TypeRef
    }
    defaultValue
  }

  fragment TypeRef on __Type {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;
