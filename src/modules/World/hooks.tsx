import { truncateString } from "@/shared/utils/string";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Graffle } from "graffle";
import { useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@cartridge/ui-next";

const columnHelper = createColumnHelper<{
  executedAt: string;
  senderAddress: string;
  transactionHash: string;
}>();

export function useWorld() {
  const [form, setForm] = useState<{
    project: string;
    model: string | undefined;
  }>({
    project: "arcade-dopewars",
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
          deployments (
            where: { serviceID: "torii", status: active },
          ) {
            edges {
              node {
                project
              }
            }
          }
        }
      `.send();
      const deployments = res?.deployments.edges
        .map(({ node }) => node.project)
        .sort((a: string, b: string) => a.localeCompare(b));
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
      return res?.models.edges
        .map(({ node }) => node)
        .sort((a, b) => a.name.localeCompare(b.name));
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

  const transactions = useInfiniteQuery({
    queryKey: ["world", form.project, "transactions"],
    queryFn: async ({ pageParam = undefined }) => {
      const res = await graffle.gql`
        query Transactions($after: String) {
          transactions(first: 60, after: $after) {
            edges {
              node {
                # calldata
                # createdAt
                executedAt
                # id
                # maxFee
                # nonce
                senderAddress
                # signature
                transactionHash
              }
              cursor
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `.send({ after: pageParam });
      return res.transactions;
    },
    getNextPageParam: ({ pageInfo }) => pageInfo.endCursor,
    initialPageParam: undefined,
  });

  const [txsPagination, setTxsPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const txsData = useMemo(
    () =>
      transactions.data?.pages
        .flatMap(({ edges }) => edges.map(({ node }) => node))
        .sort((a, b) => Number(b.executedAt) - Number(a.executedAt)) ?? [],
    [transactions.data],
  );

  const txs = useReactTable({
    data: txsData,
    columns: [
      columnHelper.accessor("transactionHash", {
        header: () => "Hash",
        cell: (info) => (
          <Link
            to={`../tx/${info.getValue()}`}
            className="flex px-4 hover:bg-button-whiteInitialHover hover:underline"
          >
            {truncateString(info.getValue())}
          </Link>
        ),
      }),
      columnHelper.accessor("senderAddress", {
        header: () => "From",
        cell: (info) => (
          <Link
            to={`../tx/${info.getValue()}`}
            className="flex px-4 hover:bg-button-whiteInitialHover hover:underline"
          >
            {truncateString(info.getValue())}
          </Link>
        ),
      }),
      columnHelper.accessor("executedAt", {
        header: () => "Age",
        cell: (info) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {dayjs.unix(Number(info.getValue())).fromNow()}
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-white">
                {info.getValue()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
      }),
    ],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: {
        pageIndex: txsPagination.pageIndex,
        pageSize: txsPagination.pageSize,
      },
    },
  });

  useEffect(() => {
    if (txs.getPageCount() - txsPagination.pageIndex < 3) {
      transactions.fetchNextPage();
    }
  }, [txsPagination, transactions, txs]);

  return {
    form,
    setForm,
    deployments,
    schema,
    models,
    model,
    txs: {
      ...txs,
      fetchNextPage: transactions.fetchNextPage,
      pagination: txsPagination,
      setPagination: setTxsPagination,
    },
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
