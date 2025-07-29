import { RPC_PROVIDER, CACHE_CONFIG } from "@/services/rpc";
import { truncateString } from "@/shared/utils/string";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Abi,
  AbiEntry,
  CallData,
  events as eventsLib,
  hash,
  RevertedTransactionReceiptResponse,
  SuccessfulTransactionReceiptResponse,
} from "starknet";
import { FunctionAbi } from "starknet";
import {
  getEventName,
  initBlockComputeData,
  parseExecutionResources,
} from "@/shared/utils/rpc";

import { useBlock } from "@starknet-react/core";
import { isValidAddress } from "@/shared/utils/contract";
import type { EVENT } from "@starknet-io/starknet-types-08";
import { TStarknetGetTransactionResponse } from "@/types/types";

interface EventData extends EVENT {
  id: string;
  event_name: string;
  block: number;
}

interface StorageDiffData {
  contract_address: string;
  key: string;
  value: string;
  block_number: number;
}

const eventColumnHelper = createColumnHelper<EventData>();
const storageDiffColumnHelper = createColumnHelper<StorageDiffData>();

export function useTransaction({ txHash }: { txHash: string | undefined }) {
  const navigate = useNavigate();
  const [eventsPagination, setEventsPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [storageDiffPagination, setStorageDiffPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const {
    data: { tx, calldata, declared },
    isLoading,
    error,
  } = useQuery<{
    tx?: Awaited<TStarknetGetTransactionResponse>;
    declared?: Awaited<ReturnType<typeof RPC_PROVIDER.getClassByHash>>;
    calldata?: { contract: string; selector: string; args: string[] }[];
  }>({
    queryKey: ["transaction", "calldata", txHash],
    queryFn: async () => {
      if (!txHash || !isValidAddress(txHash)) {
        throw new Error("Invalid transaction hash");
      }

      const tx = await RPC_PROVIDER.getTransaction(txHash);
      const declared =
        tx.type === "DECLARE"
          ? await RPC_PROVIDER.getClassByHash(tx.class_hash)
          : undefined;

      const _tx = tx as TStarknetGetTransactionResponse;
      return {
        tx: _tx,
        declared,
      };
    },
    initialData: {
      tx: undefined,
      declared: undefined,
    },
    retry: false,
  });

  const isReceiptError = (receipt: unknown): receipt is Error => {
    return receipt instanceof Error;
  };

  const {
    data: { receipt, events: eventsData, blockComputeData },
  } = useQuery({
    queryKey: ["transaction-sammary", txHash],
    queryFn: async () => {
      const receiptResult = await RPC_PROVIDER.getTransactionReceipt(
        txHash || "",
      );

      if (isReceiptError(receiptResult)) {
        throw receiptResult;
      }

      const receipt = receiptResult.value as
        | SuccessfulTransactionReceiptResponse
        | RevertedTransactionReceiptResponse;

      const { executions, blockComputeData } = parseExecutionResources(
        receipt.execution_resources,
      );

      // Group events by contract address while preserving original indices
      const eventsByContract = receipt.events.reduce<
        Record<string, Array<{ event: EventData; originalIndex: number }>>
      >((acc, event, originalIndex) => {
        const address = event.from_address;
        if (!acc[address]) {
          acc[address] = [];
        }
        acc[address].push({
          event: {
            id: `${receipt.transaction_hash}-${originalIndex}`,
            event_name: getEventName(event.keys[0]),
            from_address: address,
            data: event.data,
            keys: event.keys,
            block: receipt.block_number,
          },
          originalIndex,
        });
        return acc;
      }, {});

      const eventsWithIndices = await Promise.all(
        Object.entries(eventsByContract).map(
          async ([address, eventEntries]) => {
            // Fetch contract ABI once per contract
            const { abi: contract_abi } =
              await RPC_PROVIDER.getClassAt(address);

            // Get all events for this contract in one call
            const eventsResponse = await RPC_PROVIDER.getEvents({
              address,
              chunk_size: 100,
              keys: [eventEntries.map(({ event }) => event.keys).flat()],
              from_block: { block_number: receipt.block_number },
              to_block: { block_number: receipt.block_number },
            });

            // Parse events once per contract
            const abiEvents = eventsLib.getAbiEvents(contract_abi);
            const abiStructs = CallData.getAbiStruct(contract_abi);
            const abiEnums = CallData.getAbiEnum(contract_abi);

            // Map events while preserving original indices

            const parsedEvents = eventsLib.parseEvents(
              eventsResponse.events,
              abiEvents,
              abiStructs,
              abiEnums,
            );

            return eventEntries.map(({ originalIndex }) => {
              const matchingParsedEvent =
                parsedEvents.find(
                  (e) => e.transaction_hash === receipt.transaction_hash,
                ) || {};

              const eventKey = matchingParsedEvent
                ? (Object.keys(matchingParsedEvent).find((key) =>
                    key.includes("::"),
                  ) ?? "")
                : "";

              return {
                originalIndex,
                eventData: {
                  id: `${receipt.transaction_hash}-${originalIndex}`,
                  from_address: address,
                  event_name: getEventName(eventKey),
                  block: receipt.block_number,
                  data: Object.keys(matchingParsedEvent),
                  // data: eventKey,
                  keys: eventEntries[originalIndex].event.keys,
                } satisfies EventData,
              };
            });
          },
        ),
      );

      const events = eventsWithIndices
        .flat()
        .sort((a, b) => b.originalIndex - a.originalIndex)
        .map(({ eventData }) => eventData);

      return {
        receipt,
        events,
        blockComputeData,
      };
    },
    enabled: typeof txHash === "string",
    initialData: {
      receipt: {} as SuccessfulTransactionReceiptResponse,
      events: [],
      blockComputeData: initBlockComputeData,
    },
  });

  const { data: storageDiffData } = useQuery<StorageDiffData[]>({
    queryKey: ["transaction", txHash, "storageDiff"],
    queryFn: async () => {
      const trace = await RPC_PROVIDER.getTransactionTrace(txHash || "");
      return trace.state_diff!.storage_diffs.flatMap((storage_diff) => {
        const contract_address = storage_diff.address;
        return storage_diff.storage_entries.map((entry) => ({
          contract_address,
          key: entry.key,
          value: entry.value,
          block_number: receipt.block_number,
        }));
      });
    },
    initialData: [],
    enabled: !!txHash,
    ...CACHE_CONFIG,
  });

  const { data: block } = useBlock({
    blockIdentifier: receipt?.block_number,
    enabled: typeof receipt?.block_number === "number",
  });

  const eventsColumns = useMemo(
    () => [
      eventColumnHelper.accessor("id", {
        header() {
          return (
            <div className="w-1 text-left border-0">
              <span>ID</span>
            </div>
          );
        },
        cell: (info) => (
          <div
            className="flex border-0 pr-4 justify-start cursor-pointer text-left"
            onClick={() => navigate(`../event/${info.getValue().toString()}`)}
          >
            <span className="whitespace-nowrap hover:transition-all">
              {truncateString(info.getValue())}
            </span>
          </div>
        ),
      }),
      eventColumnHelper.accessor("from_address", {
        header() {
          return (
            <div className="text-left border-0">
              <span>From Address</span>
            </div>
          );
        },
        cell: (info) => (
          <div
            onClick={() => navigate(`../contract/${info.getValue()}`)}
            className="w-1 pr-4 border-0 text-left hover:underline cursor-pointer"
          >
            <span>{truncateString(info.getValue())}</span>
          </div>
        ),
      }),
      eventColumnHelper.accessor("event_name", {
        header() {
          return (
            <div className="text-left border-0">
              <span>Event Name</span>
            </div>
          );
        },
        cell: (info) => (
          <div className="w-1 text-left border-0 pr-4">
            <span>{info.getValue()}</span>
          </div>
        ),
      }),
      eventColumnHelper.accessor("block", {
        header() {
          return (
            <div className="text-right border-0">
              <span>Block</span>
            </div>
          );
        },
        cell: (info) => (
          <div
            onClick={() => navigate(`../block/${info.getValue().toString()}`)}
            className="w-1 text-right border-0 cursor-pointer transition-all"
          >
            <span>{info.getValue()}</span>
          </div>
        ),
      }),
    ],
    [navigate],
  );

  // sort events data by id

  const events = useReactTable({
    data: eventsData,
    columns: eventsColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setEventsPagination,
    state: {
      pagination: eventsPagination,
    },
  });

  const storageDiffColumns = useMemo(
    () => [
      storageDiffColumnHelper.accessor("contract_address", {
        header() {
          return (
            <div className="text-left border-0">
              <span>Contract Address</span>
            </div>
          );
        },
        cell: (info) => (
          <div
            onClick={() => navigate(`../contract/${info.getValue()}`)}
            className="text-left border-0 cursor-pointer hover:text-blue-400 transition-all pr-4"
          >
            <span>{truncateString(info.getValue())}</span>
          </div>
        ),
      }),
      storageDiffColumnHelper.accessor("key", {
        header() {
          return (
            <div className="text-left border-0">
              <span>Key</span>
            </div>
          );
        },
        cell: (info) => {
          const key = info.getValue();
          return (
            <div className="text-left pr-4">
              <span className="uppercase">{truncateString(key)}</span>
            </div>
          );
        },
      }),
      storageDiffColumnHelper.accessor("value", {
        header() {
          return (
            <div className="text-left border-0">
              <span>Value</span>
            </div>
          );
        },
        cell: (info) => {
          const value = info.getValue();
          return (
            <div className="text-left pr-4">
              <span>{truncateString(value)}</span>
            </div>
          );
        },
      }),
      storageDiffColumnHelper.accessor("block_number", {
        header() {
          return (
            <div className="text-right border-0">
              <span>Block Number</span>
            </div>
          );
        },
        cell: (info) => {
          const block_number = info.getValue();
          return (
            <div
              onClick={() => navigate(`../block/${block_number.toString()}`)}
              className="text-right border-0 cursor-pointer hover:text-blue-400 transition-all"
            >
              <span>{block_number}</span>
            </div>
          );
        },
      }),
    ],
    [navigate],
  );

  const storageDiff = useReactTable({
    data: storageDiffData,
    columns: storageDiffColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setStorageDiffPagination,
    state: {
      pagination: storageDiffPagination,
    },
  });

  return {
    isLoading,
    error,
    data: {
      tx,
      declared,
      receipt,
      calldata,
      block,
      blockComputeData,
      events,
      storageDiff,
    },
  };
}
export interface Calldata {
  contract: string;
  selector: string;
  args: string[];
}

interface DecodedArg {
  name: string;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

interface AbiItem {
  type: string;
  name?: string;
  inputs?: Array<{ name: string; type: string }>;
  outputs?: Array<{ name: string; type: string }>;
  selector?: string;
  items?: AbiItem[];
  state_mutability?: string;
  members?: Array<{ name: string; type: string; offset: number }>;
}

export function useCalldata(calldata: Calldata[] | undefined) {
  const { txHash } = useParams<{ txHash: string }>();

  return useQuery({
    queryKey: ["tx", txHash, "calldata", calldata],
    queryFn: async () => {
      if (!calldata || calldata.length === 0) return;

      return Promise.all(
        calldata.map(async (d) => {
          try {
            const c = await RPC_PROVIDER.getClassAt(d.contract);
            const abi = c.abi;
            let matchingFunction: AbiItem | undefined;

            // First check interfaces
            abi.forEach((item: AbiItem) => {
              if (item.type === "function") {
                const funcNameSelector = hash.getSelector(item.name || "");
                if (funcNameSelector === d.selector) {
                  matchingFunction = item;
                }
              }

              if (item.type === "interface") {
                item.items?.forEach((func: AbiItem) => {
                  if (func.type === "function") {
                    const funcNameSelector = hash.getSelector(func.name || "");
                    if (funcNameSelector === d.selector) {
                      matchingFunction = func;
                    }
                  }
                });
              }
            });

            const formattedParams = d.args;

            let sortedAbi: Abi = [];

            // prioritize function type first
            if (Array.isArray(abi)) {
              sortedAbi = abi.sort((a, b) => {
                if (a.type === "function" && b.type !== "function") return -1;
                if (a.type !== "function" && b.type === "function") return 1;
                return (a.name || "").localeCompare(b.name || "");
              });
            }

            const myCallData = new CallData(sortedAbi);

            const { inputs } = myCallData.parser
              .getLegacyFormat()
              .find(
                (abiItem: AbiEntry) => abiItem.name === matchingFunction?.name,
              ) as FunctionAbi;

            const inputsTypes = inputs.map((inp) => {
              return inp.type;
            });

            const decoded = myCallData.decodeParameters(
              inputsTypes,
              formattedParams,
            );

            const formattedResponse: DecodedArg[] = [];

            if (Array.isArray(decoded)) {
              if (inputs.length === 1) {
                formattedResponse.push({
                  value: decoded,
                  name: inputs[0]?.name,
                  type: inputs[0]?.type,
                });
              } else {
                decoded.forEach((arg, index) => {
                  formattedResponse.push({
                    value: arg,
                    name: inputs[index]?.name,
                    type: inputs[index]?.type,
                  });
                });
              }
            } else {
              formattedResponse.push({
                value: decoded,
                name: inputs[0]?.name,
                type: inputs[0]?.type,
              });
            }

            return {
              contract: d.contract,
              function_name: matchingFunction?.name || "",
              selector: d.selector,
              data: formattedResponse,
              params: inputs.map((inp) => inp?.name),
              raw_args: d.args,
            };
          } catch (e) {
            console.error("error decoding: ", e);
            return {
              contract: d.contract,
              function_name: "Error",
              selector: d.selector,
              params: [],
              raw_args: d.args,
              data: d.args.map((arg, index) => ({
                name: `arg${index}`,
                type: "unknown",
                value: arg,
              })),
            };
          }
        }),
      );
    },
    enabled: !!calldata && !!txHash,
    retry: false,
  });
}
