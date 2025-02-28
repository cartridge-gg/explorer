import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { formatNumber } from "@/shared/utils/number";
import {
  formatSnakeCaseToDisplayValue,
  truncateString,
} from "@/shared/utils/string";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import EventsTable from "./components/EventsTable";
import StorageDiffTable from "./components/StorageDiffTable";
import { useScreen } from "@/shared/hooks/useScreen";
import dayjs from "dayjs";
import { cairo, CallData, events } from "starknet";
import { decodeCalldata, getEventName } from "@/shared/utils/rpc_utils";
import CalldataDisplay from "./components/CalldataDisplay";
import { EXECUTION_RESOURCES_KEY_MAP } from "@/constants/rpc";
import { Breadcrumb } from "@/shared/components/breadcrums";
import { BreadcrumbList } from "@/shared/components/breadcrums";
import { BreadcrumbPage } from "@/shared/components/breadcrums";
import { BreadcrumbSeparator } from "@/shared/components/breadcrums";
import { BreadcrumbItem } from "@/shared/components/breadcrums";
import { BreadcrumbLink } from "@/shared/components/breadcrums";

const DataTabs = [
  "Calldata",
  "Events",
  "Signature",
  "Internal Calls",
  "Messages",
  "Storage Diffs",
];

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
const events_columns = [
  eventColumnHelper.accessor("id", {
    header: () => "id",
    cell: (info) => info.getValue(),
  }),
  eventColumnHelper.accessor("from", {
    header: "from",
    cell: (info) => info.getValue(),
  }),
  eventColumnHelper.accessor("event_name", {
    header: "Event Name",
    cell: (info) => info.getValue(),
  }),
  eventColumnHelper.accessor("block", {
    header: "block",
    cell: (info) => formatNumber(info.getValue()),
  }),
];

const storageDiffColumnHelper = createColumnHelper<StorageDiffData>();
const storage_diff_columns = [
  storageDiffColumnHelper.accessor("contract_address", {
    header: () => "Contract Address",
    cell: (info) => info.getValue(),
    footer: (info) => info.column.id,
  }),
  storageDiffColumnHelper.accessor("key", {
    header: "Key",
    cell: (info) => {
      const date = Number(info.getValue());
      return date;
    },
  }),
  storageDiffColumnHelper.accessor("value", {
    header: "Value",
    cell: (info) => {
      const date = Number(info.getValue());
      return date;
    },
  }),
  storageDiffColumnHelper.accessor("block_number", {
    header: "Block Number",
    cell: (info) => {
      const date = Number(info.getValue());
      return date;
    },
  }),
];

export default function TransactionDetails() {
  const { txHash } = useParams<{ txHash: string }>();
  const { isMobile } = useScreen();
  const [selectedDataTab, setSelectedDataTab] = useState(DataTabs[0]);
  const [executionData, setExecutionData] = useState({
    bitwise: 0,
    pedersen: 0,
    range_check: 0,
    posiedon: 0,
    ecdsa: 0,
    segment_arena: 0,
    keccak: 0,
    memory_holes: 0,
    ec_op: 0,
  });

  const [blockComputeData, setBlockComputeData] = useState({
    gas: 0,
    data_gas: 0,
    steps: 0,
  });

  const [eventsData, setEventsData] = useState<EventData[]>([]);
  const [callData, setCallData] = useState<
    { contract: string; selector: string; args: string[] }[]
  >([]);
  const [eventsPagination, setEventsPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const [storageDiffData, setStorageDiffData] = useState([]);
  const [storageDiffPagination, setStorageDiffPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const { data: TransactionReceipt } = useQuery({
    queryKey: ["txn_receipt"],
    queryFn: () => RPC_PROVIDER.getTransactionReceipt(txHash ?? 0),
    enabled: !!txHash,
  });

  const { data: TransactionTrace } = useQuery({
    queryKey: ["txn_trace"],
    queryFn: () => RPC_PROVIDER.getTransactionTrace(txHash ?? 0),
  });

  const { data: TransactionDetails } = useQuery({
    queryKey: ["txn_details"],
    queryFn: () => RPC_PROVIDER.getTransactionByHash(txHash ?? 0),
  });

  const { data: BlockDetails } = useQuery({
    queryKey: ["txn_block_details"],
    queryFn: () => RPC_PROVIDER.getBlock(TransactionReceipt?.block_number),
  });

  const processTransactionReceipt = useCallback(async () => {
    // Check if events are already processed
    if (eventsData.length > 0 || !TransactionReceipt?.events) return;

    try {
      // Group events by contract address while preserving original indices
      const eventsByContract: Record<
        string,
        Array<{ event: EventData; originalIndex: number }>
      > = TransactionReceipt?.events.reduce((acc, event, originalIndex) => {
        const address = event.from_address;
        if (!acc[address]) {
          acc[address] = [];
        }
        acc[address].push({ event, originalIndex });
        return acc;
      }, {});

      // Process events for each contract
      const processedEventsArrays = await Promise.all(
        Object.entries(eventsByContract).map(
          async ([address, eventEntries]) => {
            // Fetch contract ABI once per contract
            const { abi: contract_abi } = await RPC_PROVIDER.getClassAt(
              address
            );

            // Get all events for this contract in one call
            const eventsResponse = await RPC_PROVIDER.getEvents({
              address,
              chunk_size: 100,
              keys: [eventEntries.map(({ event }) => event.keys).flat()],
              from_block: { block_number: TransactionReceipt.block_number },
              to_block: { block_number: TransactionReceipt.block_number },
            });

            // Parse events once per contract
            const abiEvents = events.getAbiEvents(contract_abi);
            const abiStructs = CallData.getAbiStruct(contract_abi);
            const abiEnums = CallData.getAbiEnum(contract_abi);

            const parsedEvents = events.parseEvents(
              eventsResponse.events,
              abiEvents,
              abiStructs,
              abiEnums
            );

            // Map events while preserving original indices
            return eventEntries?.map(({ _, originalIndex }) => {
              const matchingParsedEvent = parsedEvents.find(
                (e: ParsedEvent) =>
                  e.transaction_hash === TransactionReceipt.transaction_hash
              );

              const eventKey = matchingParsedEvent
                ? Object.keys(matchingParsedEvent).find((key) =>
                    key.includes("::")
                  )
                : "";

              return {
                originalIndex,
                eventData: {
                  id: `${TransactionReceipt?.transaction_hash}-${originalIndex}`,
                  from: address,
                  event_name: getEventName(eventKey || ""),
                  block: TransactionReceipt?.block_number,
                  data: matchingParsedEvent,
                },
              };
            });
          }
        )
      );

      // Flatten and sort by original index to maintain event order
      const processedEvents = processedEventsArrays
        .flat()
        .sort((a, b) => b.originalIndex - a.originalIndex)
        .map(({ eventData }) => eventData);

      // Update state once with all processed events in correct order
      setEventsData(processedEvents);
    } catch (error) {
      console.error("Error processing transaction events:", error);
      // Optionally set an error state here
    }

    const receipt = TransactionReceipt?.execution_resources;
    // process execution resources
    Object.keys(TransactionReceipt?.execution_resources).forEach((key) => {
      if (key === "steps") {
        setBlockComputeData((prev) => ({
          ...prev,
          steps: prev.steps + receipt[key],
        }));
      } else if (key === "data_availability") {
        setBlockComputeData((prev) => ({
          ...prev,
          gas: prev.gas + receipt[key].l1_gas,
          data_gas: prev.data_gas + receipt[key].l1_data_gas,
        }));
      } else {
        const key_map =
          EXECUTION_RESOURCES_KEY_MAP[
            key as keyof typeof EXECUTION_RESOURCES_KEY_MAP
          ];
        if (key_map) {
          setExecutionData((prev) => ({
            ...prev,
            [key_map as keyof typeof executionData]:
              prev[key_map as keyof typeof executionData] + receipt[key],
          }));
        }
      }
    });
  }, [TransactionReceipt, eventsData.length]);

  useEffect(() => {
    if (!TransactionReceipt) return;
    processTransactionReceipt();
  }, [TransactionReceipt, processTransactionReceipt]);

  const processTransactionTrace = useCallback(async () => {
    // check if storage diffs are already processed
    if (storageDiffData.length > 0) return;
    // process storage diffs
    if (TransactionTrace?.state_diff?.storage_diffs) {
      TransactionTrace?.state_diff?.storage_diffs?.forEach((storage_diff) => {
        const contract_address = storage_diff.address;
        const storage_entries = storage_diff.storage_entries.map((entry) => {
          return {
            contract_address,
            key: entry.key,
            value: entry.value,
            block_number: TransactionReceipt?.block_number,
          };
        });
        setStorageDiffData((prev) => {
          return [...prev, ...storage_entries];
        });
      });
    }
  }, [TransactionTrace, TransactionReceipt, storageDiffData.length]);

  useEffect(() => {
    if (!TransactionTrace || !TransactionReceipt) return;
    processTransactionTrace();
  }, [TransactionReceipt, processTransactionTrace, TransactionTrace]);

  const processTransactionDetails = useCallback(async () => {
    // process calldata
    const calldata = TransactionDetails?.calldata;

    if (!calldata) return;

    const transactions = decodeCalldata(calldata);
    setCallData(transactions);
  }, [TransactionDetails]);

  useEffect(() => {
    if (!TransactionDetails) return;
    processTransactionDetails();
  }, [TransactionDetails, processTransactionDetails]);

  // sort events data by id

  const eventsTable = useReactTable({
    data: eventsData,
    columns: events_columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: {
        pageIndex: eventsPagination.pageIndex,
        pageSize: eventsPagination.pageSize,
      },
    },
  });

  const storageDiffTable = useReactTable({
    data: storageDiffData,
    columns: storage_diff_columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: {
        pageIndex: storageDiffPagination.pageIndex,
        pageSize: storageDiffPagination.pageSize,
      },
    },
  });

  return (
    <div className="flex flex-col w-full gap-8 px-2 py-4">
      <div className="flex flex-col w-full gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="" href="/">
                .
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink className=" text-sm" href="/">
                explrr
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink className=" text-sm" href="/txns">
                transactions
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className=" text-sm">
                {isMobile && txHash ? truncateString(txHash) : txHash}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-row  justify-between items-center uppercase bg-[#4A4A4A] px-4 py-2">
          <h1 className="text-white">Transactions</h1>
        </div>
        <div className=" flex flex-col w-full lg:flex-row gap-4 pb-4">
          <div className=" flex flex-col gap-4">
            <div
              style={{
                borderBottomStyle: "dashed",
                borderBottomWidth: "2px",
              }}
              className="flex flex-col gap-4 p-4 border-[#8E8E8E] border-l-4 border-t border-r"
            >
              <div className="flex flex-col text-sm  gap-2">
                <p className=" w-fit font-bold  px-2 py-1 bg-[#D9D9D9] text-black">
                  Hash
                </p>
                <p>
                  {isMobile && TransactionReceipt?.transaction_hash
                    ? truncateString(TransactionReceipt?.transaction_hash)
                    : txHash}
                </p>
              </div>
              <div className="flex flex-col text-sm gap-1">
                <p className=" w-fit font-bold  px-2 py-1 bg-[#D9D9D9] text-black">
                  Status
                </p>
                <p className=" uppercase">
                  {TransactionReceipt?.statusReceipt}
                </p>
              </div>
              <div className="flex flex-col text-sm gap-1">
                <p className=" w-fit font-bold  px-2 py-1 bg-[#D9D9D9] text-black">
                  Type
                </p>
                <p>{TransactionDetails?.type}</p>
              </div>
              <div className="flex flex-col text-sm gap-1">
                <p className=" w-fit font-bold  px-2 py-1 bg-[#D9D9D9] text-black">
                  Block Number
                </p>
                <p>{TransactionReceipt?.block_number}</p>
              </div>
              <div className="flex flex-col text-sm gap-1">
                <p className=" w-fit font-bold  px-2 py-1 bg-[#D9D9D9] text-black">
                  Timestamp
                </p>
                <p>
                  {BlockDetails?.timestamp} ({" "}
                  {dayjs
                    .unix(BlockDetails?.timestamp)
                    .format("MMM D YYYY HH:mm:ss")}{" "}
                  )
                </p>
              </div>
              <div className="flex flex-col text-sm gap-1">
                <p className=" w-fit font-bold  px-2 py-1 bg-[#D9D9D9] text-black">
                  Nonce
                </p>
                <p>{TransactionDetails?.nonce}</p>
              </div>
              <div className="flex flex-col text-sm gap-1">
                <p className=" w-fit font-bold  px-2 py-1 bg-[#D9D9D9] text-black">
                  Sender Address
                </p>
                <p>
                  {isMobile && TransactionDetails?.sender_address
                    ? truncateString(TransactionDetails?.sender_address)
                    : TransactionDetails?.sender_address}
                </p>
              </div>
            </div>
            <div
              style={{
                borderTopStyle: "dashed",
                borderTopWidth: "2px",
                borderBottomStyle: "dashed",
                borderBottomWidth: "2px",
              }}
              className="flex flex-col h-fit gap-4 p-4 border-[#8E8E8E] border-l-4 border-t border-r"
            >
              <div className="flex flex-col text-sm  gap-1">
                <p className=" w-fit font-bold  px-2 py-1 bg-[#D9D9D9] text-black">
                  ACTUAL FEE
                </p>
                <p>
                  {TransactionReceipt?.actual_fee?.amount
                    ? formatNumber(
                        Number(
                          cairo.felt(TransactionReceipt?.actual_fee?.amount)
                        )
                      )
                    : 0}{" "}
                  {TransactionReceipt?.actual_fee?.unit}
                </p>
              </div>
            </div>
            <div
              style={{
                borderTopStyle: "dashed",
                borderTopWidth: "2px",
              }}
              className="flex flex-col gap-4 p-4 border-[#8E8E8E] border-l-4 border-b border-r"
            >
              <div className="flex flex-col text-sm gap-4 w-full">
                <div className="flex flex-row w-full text-center">
                  <div className=" flex flex-row w-full">
                    <div className=" w-full block bg-[#4A4A4A] py-2">
                      <p className=" text-white">GAS</p>
                    </div>
                    <div className=" w-full block py-2 border border-[#DBDBDB]">
                      <p>{formatNumber(blockComputeData.gas)}</p>
                    </div>
                  </div>
                  <div className=" flex flex-row w-full">
                    <div className=" w-full block bg-[#4A4A4A] py-2">
                      <p className=" text-white">DA GAS</p>
                    </div>
                    <div className=" w-full block py-2 border border-[#DBDBDB]">
                      <p>{formatNumber(blockComputeData.data_gas)}</p>
                    </div>
                  </div>
                </div>
                <div className=" w-full bg-[#8E8E8E] h-[1px]" />
                <div className=" flex w-full flex-col text-center">
                  <div className=" w-full block bg-[#4A4A4A] py-2">
                    <p className=" text-white">STEPS</p>
                  </div>
                  <div className=" w-full block py-2 border border-[#DBDBDB]">
                    <p>{formatNumber(blockComputeData.steps)}</p>
                  </div>
                </div>
                <div className=" flex flex-col">
                  <h2 className="text-md font-bold">BUILTINS COUNTER:</h2>
                  <table className="w-full border-collapse mt-2">
                    <tbody className=" text-center w-full">
                      {Object.entries(executionData).map(
                        ([key, value], index, array) => {
                          const heading = formatSnakeCaseToDisplayValue(key);
                          return index % 2 === 0 ? (
                            <tr key={index} className="w-full flex ">
                              <td className="p-1 bg-gray-100 w-1/2 border">
                                {heading}
                              </td>
                              <td className="p-1 w-1/2 border">
                                {formatNumber(value)}
                              </td>

                              {array[index + 1] ? (
                                <>
                                  <td className="p-1 bg-gray-100 w-1/2 border">
                                    {formatSnakeCaseToDisplayValue(
                                      array[index + 1][0]
                                    )}
                                  </td>
                                  <td className="p-1 w-1/2 border">
                                    {formatNumber(array[index + 1][1])}
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="w-1/2 border-l border-t p-1" />
                                  <td className="w-1/2 border border-transparent p-1" />
                                </>
                              )}
                            </tr>
                          ) : null;
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="border relative border-[#8E8E8E] flex flex-col gap-4 w-full overflow-y-auto max-h-[61.5rem]">
            <div className="flex sticky top-0 bg-white flex-col sm:flex-row text-center px-4 pt-5 pb-4">
              {DataTabs.map((tab, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor:
                      selectedDataTab === tab ? "#8E8E8E" : "#fff",
                    color: selectedDataTab === tab ? "#fff" : "#000",
                  }}
                  onClick={() => setSelectedDataTab(tab)}
                  className="w-full border border-b-4 p-2 border-[#8E8E8E] uppercase cursor-pointer"
                >
                  <p>{tab}</p>
                </div>
              ))}
            </div>

            <div className=" h-full pb-2 w-full">
              {selectedDataTab === "Calldata" ? (
                <CalldataDisplay calldata={callData} />
              ) : selectedDataTab === "Events" ? (
                <EventsTable
                  table={eventsTable}
                  pagination={eventsPagination}
                  setPagination={setEventsPagination}
                />
              ) : selectedDataTab === "Signature" ? (
                <ul className="w-full flex flex-col gap-2 p-4">
                  {TransactionDetails?.signature.map((signature, index) => (
                    <li
                      key={index}
                      className="text-sm py-2 border-b border-[#8E8E8E]"
                    >
                      {signature}
                    </li>
                  ))}
                </ul>
              ) : selectedDataTab === "Storage Diffs" ? (
                <StorageDiffTable
                  table={storageDiffTable}
                  pagination={storageDiffPagination}
                  setPagination={setStorageDiffPagination}
                />
              ) : (
                <div className="p-4 text-center">
                  <p className="text-black">No data found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
