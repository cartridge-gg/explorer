import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { truncateString } from "@/shared/utils/string";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CallData, events as eventsLib } from "starknet";
import {
  decodeCalldata,
  getEventName,
  initBlockComputeData,
  initExecutions,
  parseExecutionResources,
} from "@/shared/utils/rpc_utils";
import { CACHE_TIME, STALE_TIME } from "@/constants/rpc";
import { useBlock } from "@starknet-react/core";
import { isValidAddress } from "@/shared/utils/contract";

interface ParsedEvent {
  transaction_hash: string;
  [key: string]: string | number;
}

interface EventData {
  id: string;
  from: string;
  event_name: string;
  block: number;
  data?: ParsedEvent;
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
    data: { tx, calldata },
    isLoading,
    error,
  } = useQuery<{
    tx?: Awaited<ReturnType<typeof RPC_PROVIDER.getTransaction>>;
    calldata: { contract: string; selector: string; args: string[] }[];
  }>({
    queryKey: ["transaction", "calldata", txHash],
    queryFn: async () => {
      if (!txHash || !isValidAddress(txHash)) {
        throw new Error("Invalid transaction hash");
      }

      const tx = await RPC_PROVIDER.getTransaction(txHash || "");
      return {
        tx,
        calldata: "calldata" in tx ? decodeCalldata(tx.calldata) : [],
      };
    },
    initialData: {
      tx: undefined,
      calldata: [],
    },
    retry: false,
  });

  const {
    data: { receipt, events, executions, blockComputeData },
  } = useQuery({
    queryKey: ["transaction-sammary", txHash],
    queryFn: async () => {
      const receipt = await RPC_PROVIDER.getTransactionReceipt(txHash || "");
      const { executions, blockComputeData } = parseExecutionResources(
        receipt.execution_resources,
      );

      // Group events by contract address while preserving original indices
      const eventsByContract: Record<
        string,
        Array<{ event: EventData; originalIndex: number }>
      > = receipt?.events.reduce((acc, event, originalIndex) => {
        const address = event.from_address;
        if (!acc[address]) {
          acc[address] = [];
        }
        acc[address].push({ event, originalIndex });
        return acc;
      }, {});
      const events: EventData[] = (
        await Promise.all(
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
              return eventEntries?.map(({ originalIndex }) => {
                const matchingParsedEvent = eventsLib
                  .parseEvents(
                    eventsResponse.events,
                    abiEvents,
                    abiStructs,
                    abiEnums,
                  )
                  .find(
                    (e: ParsedEvent) =>
                      e.transaction_hash === receipt.transaction_hash,
                  );

                const eventKey: string = matchingParsedEvent
                  ? (Object.keys(matchingParsedEvent).find((key) =>
                      key.includes("::"),
                    ) ?? "")
                  : "";

                return {
                  originalIndex,
                  eventData: {
                    id: `${receipt.transaction_hash}-${originalIndex}`,
                    from: address,
                    event_name: getEventName(eventKey),
                    block: receipt.block_number,
                    data: matchingParsedEvent,
                  },
                };
              });
            },
          ),
        )
      )
        .flat()
        .sort((a, b) => b.originalIndex - a.originalIndex)
        .map(({ eventData }) => eventData);

      return {
        receipt,
        events,
        executions,
        blockComputeData,
      };
    },
    enabled: typeof txHash === "string",
    initialData: {
      receipt: undefined,
      events: [],
      executions: initExecutions,
      blockComputeData: initBlockComputeData,
    },
  });

  const { data: storageDiff } = useQuery<StorageDiffData[]>({
    queryKey: ["transaction", txHash, "storageDiff"],
    queryFn: async () => {
      const trace = await RPC_PROVIDER.getTransactionTrace(txHash || "");
      return trace.state_diff?.storage_diffs?.flatMap((storage_diff) => {
        const contract_address = storage_diff.address;
        return storage_diff.storage_entries.map((entry) => ({
          contract_address,
          key: entry.key,
          value: entry.value,
          block_number: receipt?.block_number,
        }));
      });
    },
    initialData: [],
    enabled: !!txHash,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
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
      eventColumnHelper.accessor("from", {
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

  const eventsTable = useReactTable({
    data: events,
    columns: eventsColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: {
        pageIndex: eventsPagination.pageIndex,
        pageSize: eventsPagination.pageSize,
      },
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

  const storageDiffTable = useReactTable({
    data: storageDiff,
    columns: storageDiffColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: {
        pageIndex: storageDiffPagination.pageIndex,
        pageSize: storageDiffPagination.pageSize,
      },
    },
  });
  return {
    isLoading,
    error,
    data: {
      tx,
      receipt,
      calldata,
      block,
      blockComputeData,
      executions,
      events: {
        table: eventsTable,
        pagination: eventsPagination,
        setPagination: setEventsPagination,
      },
      storageDiff: {
        table: storageDiffTable,
        pagination: storageDiffPagination,
        setPagination: setStorageDiffPagination,
      },
    },
  };
}
