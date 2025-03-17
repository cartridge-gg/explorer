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
import { useNavigate, useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import dayjs from "dayjs";
import { cairo, CallData, events } from "starknet";
import { decodeCalldata, getEventName } from "@/shared/utils/rpc_utils";
import CalldataDisplay from "./components/CalldataDisplay";
import { EXECUTION_RESOURCES_KEY_MAP } from "@/constants/rpc";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/shared/components/breadcrumbs";
import { ROUTES } from "@/constants/routes";
import { DataTable, TableCell, TableHead } from "@/shared/components/dataTable";
import DetailsPageSelector from "@/shared/components/DetailsPageSelector";
import PageHeader from "@/shared/components/PageHeader";

const DataTabs = ["Calldata", "Events", "Signature", "Storage Diffs"];

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

export default function TransactionDetails() {
  const navigate = useNavigate();
  const { txHash } = useParams<{ txHash: string }>();
  const { isMobile } = useScreen();
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

  const [selectedDataTab, setSelectedDataTab] = useState(DataTabs[0]);

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

  const navigateToBlock = useCallback(
    (block_number: string) => {
      navigate(
        `${ROUTES.BLOCK_DETAILS.urlPath.replace(":blockNumber", block_number)}`
      );
    },
    [navigate]
  );

  const navigateToContract = useCallback(
    (contract_address: string) => {
      navigate(
        `${ROUTES.CONTRACT_DETAILS.urlPath.replace(
          ":contractAddress",
          contract_address
        )}`
      );
    },
    [navigate]
  );

  const navigateToEvent = useCallback(
    (event_id: string) => {
      navigate(`${ROUTES.EVENT_DETAILS.urlPath.replace(":eventId", event_id)}`);
    },
    [navigate]
  );
  const events_columns = [
    eventColumnHelper.accessor("id", {
      header() {
        return (
          <TableHead className="w-1 text-left border-0">
            <span>ID</span>
          </TableHead>
        );
      },
      cell: (info) => (
        <TableCell
          className="flex border-0 pr-4 justify-start overflow-hidden cursor-pointer text-left"
          onClick={() => navigateToEvent(info.getValue().toString())}
        >
          <span className="whitespace-nowrap hover:text-blue-400 transition-all">
            {truncateString(info.getValue())}
          </span>
          <span className="sm:visible hidden flex-grow border-dotted border-b border-gray-500 mx-2"></span>
        </TableCell>
      ),
    }),
    eventColumnHelper.accessor("from", {
      header() {
        return (
          <TableHead className="text-left border-0">
            <span>From Address</span>
          </TableHead>
        );
      },
      cell: (info) => (
        <TableCell
          onClick={() => navigateToContract(info.getValue())}
          className="w-1 pr-4 border-0 text-left hover:text-blue-400 transition-all cursor-pointer"
        >
          <span>{truncateString(info.getValue())}</span>
        </TableCell>
      ),
    }),
    eventColumnHelper.accessor("event_name", {
      header() {
        return (
          <TableHead className="text-left border-0">
            <span>Event Name</span>
          </TableHead>
        );
      },
      cell: (info) => (
        <TableCell className="w-1 text-left border-0 pr-4">
          <span>{info.getValue()}</span>
        </TableCell>
      ),
    }),
    eventColumnHelper.accessor("block", {
      header() {
        return (
          <TableHead className="text-right border-0">
            <span>Block</span>
          </TableHead>
        );
      },
      cell: (info) => (
        <TableCell
          onClick={() => navigateToBlock(info.getValue().toString())}
          className="w-1 text-xs text-right border-0 py-2 cursor-pointer hover:text-blue-400 transition-all"
        >
          <span>{info.getValue()}</span>
        </TableCell>
      ),
    }),
  ];

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

  const storage_diff_columns = [
    storageDiffColumnHelper.accessor("contract_address", {
      header() {
        return (
          <TableHead className="text-left border-0">
            <span>Contract Address</span>
          </TableHead>
        );
      },
      cell: (info) => (
        <TableCell
          onClick={() => navigateToContract(info.getValue())}
          className="text-left border-0 cursor-pointer hover:text-blue-400 transition-all pr-4"
        >
          <span>{truncateString(info.getValue())}</span>
        </TableCell>
      ),
    }),
    storageDiffColumnHelper.accessor("key", {
      header() {
        return (
          <TableHead className="text-left border-0">
            <span>Key</span>
          </TableHead>
        );
      },
      cell: (info) => {
        const key = info.getValue();
        return (
          <TableCell className="text-left pr-4">
            <span className="uppercase">{truncateString(key)}</span>
          </TableCell>
        );
      },
    }),
    storageDiffColumnHelper.accessor("value", {
      header() {
        return (
          <TableHead className="text-left border-0">
            <span>Value</span>
          </TableHead>
        );
      },
      cell: (info) => {
        const value = info.getValue();
        return (
          <TableCell className="text-left pr-4">
            <span>{truncateString(value)}</span>
          </TableCell>
        );
      },
    }),
    storageDiffColumnHelper.accessor("block_number", {
      header() {
        return (
          <TableHead className="text-right border-0">
            <span>Block Number</span>
          </TableHead>
        );
      },
      cell: (info) => {
        const block_number = info.getValue();
        return (
          <TableCell
            onClick={() => navigateToBlock(block_number.toString())}
            className="text-right border-0 cursor-pointer hover:text-blue-400 transition-all"
          >
            <span>{block_number}</span>
          </TableCell>
        );
      },
    }),
  ];

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
    <div className="flex flex-col w-full gap-8 px-2 py-4 max-w-screen overflow-hidden">
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

        <PageHeader
          className="mb-6"
          title={`Transaction `}
          subtext={TransactionReceipt?.finality_status}
        />

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

          <div className="h-full flex-grow grid grid-rows-[min-content_1fr]">
            <DetailsPageSelector
              selected={DataTabs[0]}
              onTabSelect={setSelectedDataTab}
              items={DataTabs.map((tab) => ({
                name: tab,
                value: tab,
              }))}
            />

            <div className="flex h-auto overflow-x-auto flex-col gap-3 mt-[6px] px-[15px] py-[17px] border border-borderGray rounded-b-md">
              <div className="w-full h-auto overflow">
                {selectedDataTab === "Calldata" ? (
                  <CalldataDisplay calldata={callData} />
                ) : selectedDataTab === "Events" ? (
                  <DataTable
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
                  <DataTable
                    table={storageDiffTable}
                    pagination={storageDiffPagination}
                    setPagination={setStorageDiffPagination}
                  />
                ) : (
                  <div className="h-full p-2 flex items-center justify-center min-h-[150px] text-xs lowercase">
                    <span className="text-[#D0D0D0]">No data found</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
