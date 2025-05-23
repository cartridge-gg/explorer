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
import { Editor } from "@monaco-editor/react";

export function useWorld() {
  const [form, setForm] = useState<{
    project: string;
    model: string | undefined;
  }>({
    project: "ryomainnet",
    model: undefined,
  });
  const { data: deployments } = useDeployments();
  const { data: schema } = useSchema(form.project);
  const { data: models } = useModels(form.project);
  const { data: model } = useModel({
    project: form.project,
    model: form.model,
  });
  const txs = useTransactionTable(form.project);
  const events = useEventsTable(form.project);
  const eventMessages = useEventMessagesTable(form.project);

  useEffect(() => {
    if (!models || form.model) return;
    setForm((form) => ({ ...form, model: models[0]?.name }));
  }, [form, models]);

  return {
    form,
    setForm,
    deployments,
    schema,
    models,
    model,
    txs,
    events,
    eventMessages,
  };
}

function useDeployments() {
  return useQuery({
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
      return res?.deployments.edges
        .map(({ node }) => node.project)
        .sort((a: string, b: string) => a.localeCompare(b));
    },
  });
}

function useToriiClient(project: string) {
  return useMemo(
    () =>
      Graffle.create().transport({
        url: `https://api.cartridge.gg/x/${project}/torii/graphql`,
      }),
    [project],
  );
}

function useSchema(project: string) {
  const torii = useToriiClient(project);

  return useQuery({
    queryKey: ["world", project, "schema"],
    queryFn: async () => {
      const res = await torii.gql`
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
}

function useModels(project: string) {
  const torii = useToriiClient(project);

  return useQuery({
    queryKey: ["world", project, "models"],
    queryFn: async () => {
      const res = await torii.gql`
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
  });
}

function useModel({ project, model }: { project: string; model?: string }) {
  const torii = useToriiClient(project);
  const { data: schema } = useSchema(project);
  const { data: models } = useModels(project);

  return useQuery({
    queryKey: ["world", project, "model", model],
    /**
     * Example:
     * query  {
     *   dopewarsGameCreatedModels {
     *     edges {
     *       node {
     *         game_id
     *         ...
     *       }
     *     }
     *   }
     * }
     */
    queryFn: async () => {
      const m = models?.find((m) => m.name === model);
      const queryName = `${m.namespace}${m.name}Models`;
      const queryType = schema.queryType.fields.find(
        (f) => f.name === queryName,
      );
      const typeName = queryType.type.name.replace("Connection", "");
      const fields = schema.types
        .find((t) => t.name === typeName)
        .fields.filter((f) => !["entity", "eventMessage"].includes(f.name))
        .map((f) => resolveFieldType(schema, f));

      const res = await torii.gql`
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
    enabled: !!schema && !!models?.length && !!model,
  });
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

function useTransactions(project: string) {
  const torii = useToriiClient(project);

  return useInfiniteQuery({
    queryKey: ["world", project, "transactions"],
    queryFn: async ({ pageParam = undefined }) => {
      const res = await torii.gql`
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
}

function useTransactionTable(project: string) {
  const txs = useTransactions(project);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const data = useMemo(
    () =>
      txs.data?.pages
        .flatMap(({ edges }) => edges.map(({ node }) => node))
        .sort(
          (a, b) =>
            new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime(),
        ) ?? [],
    [txs.data],
  );

  const columnHelper = useMemo(
    () =>
      createColumnHelper<{
        transactionHash: string;
        executedAt: string;
        senderAddress: string;
      }>(),
    [],
  );

  const table = useReactTable({
    data,
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
                {dayjs(info.getValue()).fromNow()}
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-white">
                {dayjs(info.getValue()).format("YYYY-MM-DD HH:mm:ss")}
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
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
    },
  });

  useEffect(() => {
    if (table.getPageCount() - pagination.pageIndex < 3) {
      txs.fetchNextPage();
    }
  }, [pagination, txs, table]);

  return {
    ...table,
    pagination,
    setPagination,
  };
}

function useEventMessages(project: string) {
  const torii = useToriiClient(project);

  return useInfiniteQuery({
    queryKey: ["world", project, "eventMessages"],
    queryFn: async ({ pageParam = undefined }) => {
      const res = await torii.gql`
        query EventMessages($after: String) {
          eventMessages(first: 60, after: $after) {
            edges {
              node {
                createdAt
                eventId
                executedAt
                id
                keys
                models {
                  __typename
                  # ... on dopewars_GameCreated {
        					# 	entity
        					# 	eventMessage
                  #   game_id
                  #   game_mode
                  #   hustler_id
                  #   player_id
                  #   player_name
                  # }
                }
                updatedAt
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `.send({ after: pageParam });
      return res.eventMessages;
    },
    getNextPageParam: (lastPage) => lastPage?.pageInfo?.endCursor,
    initialPageParam: undefined,
  });
}

function useEventMessagesTable(project: string) {
  const events = useEventMessages(project);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const data = useMemo(
    () =>
      events.data?.pages.flatMap(({ edges }) =>
        edges?.map(({ node }) => node),
      ) ?? [],
    [events.data],
  );

  const columnHelper = useMemo(
    () =>
      createColumnHelper<{
        createdAt: string;
        eventId: string;
        executedAt: string;
        id: string;
        keys: string[];
        models: {
          __typename: string;
        }[];
        updatedAt: string;
      }>(),
    [],
  );

  const table = useReactTable({
    data,
    columns: [
      columnHelper.accessor("eventId", {
        header: () => "id",
        cell: (info) => {
          const [, txHash, i] = info.getValue().split(":");
          const index = Number(i);
          return (
            <Link
              to={`../event/${txHash}-${index}`}
              className="flex px-4 hover:bg-button-whiteInitialHover hover:underline"
            >
              {truncateString(txHash)}-{index}
            </Link>
          );
        },
      }),
      columnHelper.accessor("keys", {
        header: () => "keys",
        cell: (info) => (
          <Editor
            height={200}
            language="json"
            options={{
              readOnly: true,
              lineNumbers: "off",
            }}
            value={JSON.stringify(info.getValue(), null, 2)}
          />
        ),
      }),
      columnHelper.accessor("models", {
        header: () => "models",
        cell: (info) => (
          <div>
            {info.getValue().map((m) => (
              <div>- {m.__typename}</div>
            ))}
          </div>
        ),
      }),
      columnHelper.accessor("executedAt", {
        header: () => "age",
        cell: (info) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {dayjs(info.getValue()).fromNow()}
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-gray-100 border border-gray-300 rounded-md"
              >
                {dayjs(info.getValue()).format("YYYY-MM-DD HH:mm:ss")}
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
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
    },
  });

  useEffect(() => {
    if (table.getPageCount() - pagination.pageIndex < 3) {
      events.fetchNextPage();
    }
  }, [pagination, events, table]);

  return {
    ...table,
    pagination,
    setPagination,
  };
}
function useEvents(project: string) {
  const torii = useToriiClient(project);

  return useInfiniteQuery({
    queryKey: ["world", project, "events"],
    queryFn: async ({ pageParam = undefined }) => {
      const res = await torii.gql`
        query Events($after: String) {
          events(first: 60, after: $after) {
            edges {
              node {
                createdAt
                data
                executedAt
                id
                keys
                transactionHash
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `.send({ after: pageParam });
      return res.events;
    },
    getNextPageParam: (lastPage) => lastPage?.pageInfo?.endCursor,
    initialPageParam: undefined,
  });
}

function useEventsTable(project: string) {
  const events = useEvents(project);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const data = useMemo(
    () =>
      events.data?.pages.flatMap(({ edges }) =>
        edges?.map(({ node }) => node),
      ) ?? [],
    [events.data],
  );

  const columnHelper = useMemo(
    () =>
      createColumnHelper<{
        data: string[];
        executedAt: string;
        id: string;
        keys: string[];
        transactionHash: string;
      }>(),
    [],
  );

  const table = useReactTable({
    data,
    columns: [
      columnHelper.accessor("id", {
        header: () => "id",
        cell: (info) => {
          const [, txHash, i] = info.getValue().split(":");
          const index = Number(i);
          return (
            <Link
              to={`../event/${txHash}-${index}`}
              className="flex px-4 hover:bg-button-whiteInitialHover hover:underline"
            >
              {truncateString(txHash)}-{index}
            </Link>
          );
        },
      }),
      columnHelper.accessor("data", {
        header: () => "data",
        cell: (info) => (
          <Editor
            height={200}
            language="json"
            options={{
              readOnly: true,
              lineNumbers: "off",
            }}
            value={JSON.stringify(info.getValue(), null, 2)}
          />
        ),
      }),
      columnHelper.accessor("keys", {
        header: () => "keys",
        cell: (info) => (
          <Editor
            height={200}
            language="json"
            options={{
              readOnly: true,
              lineNumbers: "off",
            }}
            value={JSON.stringify(info.getValue(), null, 2)}
          />
        ),
      }),
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
      columnHelper.accessor("executedAt", {
        header: () => "age",
        cell: (info) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {dayjs(info.getValue()).fromNow()}
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-gray-100 border border-gray-300 rounded-md"
              >
                {dayjs(info.getValue()).format("YYYY-MM-DD HH:mm:ss")}
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
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
    },
  });

  useEffect(() => {
    if (table.getPageCount() - pagination.pageIndex < 3) {
      events.fetchNextPage();
    }
  }, [pagination, events, table]);

  return {
    ...table,
    pagination,
    setPagination,
  };
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
