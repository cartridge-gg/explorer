import { QUERY_KEYS, RPC_PROVIDER } from "@/services/starknet_provider_config";
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
import { cairo, CallData, events } from "starknet";
import { decodeCalldata, getEventName } from "@/shared/utils/rpc_utils";
import CalldataDisplay from "./components/CalldataDisplay";
import {
  CACHE_TIME,
  EXECUTION_RESOURCES_KEY_MAP,
  STALE_TIME,
} from "@/constants/rpc";
import {
  Breadcrumb,
  BreadcrumbSeparator,
  BreadcrumbItem,
} from "@/shared/components/breadcrumbs";
import { ROUTES } from "@/constants/routes";
import { DataTable, TableCell, TableHead } from "@/shared/components/dataTable";
import DetailsPageSelector from "@/shared/components/DetailsPageSelector";
import PageHeader from "@/shared/components/PageHeader";
import { SectionBoxEntry } from "@/shared/components/section";
import { SectionBox } from "@/shared/components/section/SectionBox";
import dayjs from "dayjs";
import SignatureDisplay from "./components/SignatureDisplay";
import AddressDisplay from "@/shared/components/AddressDisplay";
import BlockIdDisplay from "@/shared/components/BlockIdDisplay";

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

const FinalityStatus = ({ status }: { status: string }) => {
  const status_color_map = {
    succeeded: "bg-[#7BA797]",
    reverted: "bg-[#C4806D]",
  };
  return (
    <div
      className={`text-white px-2 h-5 w-[84px] flex items-center justify-center font-bold ${
        status_color_map[status?.toLowerCase() as keyof typeof status_color_map]
      }`}
    >
      {status}
    </div>
  );
};

export default function TransactionDetails() {
  const navigate = useNavigate();
  const { txHash } = useParams<{ txHash: string }>();
  const { isMobile } = useScreen();
  const [executionData, setExecutionData] = useState({
    bitwise: 0,
    pedersen: 0,
    range_check: 0,
    poseidon: 0,
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
    queryKey: [QUERY_KEYS.getTransactionReceipt, txHash],
    queryFn: () => RPC_PROVIDER.getTransactionReceipt(txHash || ""),
    enabled: !!txHash,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  const { data: TransactionTrace } = useQuery({
    queryKey: [QUERY_KEYS.getTransactionTrace, txHash],
    queryFn: () => RPC_PROVIDER.getTransactionTrace(txHash || ""),
    enabled: !!txHash,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  const { data: TransactionDetails } = useQuery({
    queryKey: [QUERY_KEYS.getTransaction, txHash],
    queryFn: () => RPC_PROVIDER.getTransaction(txHash || ""),
    enabled: !!txHash,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  const { data: BlockDetails } = useQuery({
    queryKey: [QUERY_KEYS.getBlock, TransactionReceipt?.block_number],
    queryFn: () => RPC_PROVIDER.getBlock(TransactionReceipt?.block_number),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
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
          className="flex border-0 pr-4 justify-start cursor-pointer text-left"
          onClick={() => navigateToEvent(info.getValue().toString())}
        >
          <span className="whitespace-nowrap hover:text-blue-400 transition-all">
            {truncateString(info.getValue())}
          </span>
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
          className="w-1 pr-4 border-0 text-left hover:underline cursor-pointer"
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
          className="w-1 text-right border-0 cursor-pointer hover:text-blue-400 transition-all"
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
    <div id="tx-details" className="w-full flex-grow gap-8">
      <div className="mb-2">
        <Breadcrumb>
          <BreadcrumbItem href="/">Explorer</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem href="/txns">Transactions</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {isMobile && txHash ? truncateString(txHash) : txHash}
          </BreadcrumbItem>
        </Breadcrumb>
      </div>

      <PageHeader
        className="mb-6"
        title={`Transaction `}
        subtext={TransactionReceipt?.finality_status}
        titleRightComponent={
          <FinalityStatus status={TransactionReceipt?.execution_status} />
        }
        subtextRightComponent={
          <div className="text-[#5D5D5D]">
            {dayjs.unix(BlockDetails?.timestamp).format("MMM D YYYY HH:mm:ss")}{" "}
          </div>
        }
      />

      <div className="flex flex-col sl:flex-row sl:h-[73vh] gap-4">
        <div className="sl:w-[468px] sl:min-w-[468px] flex flex-col gap-[6px] sl:overflow-y-scroll">
          <SectionBox variant="upper-half">
            <SectionBoxEntry title="Hash">
              {isMobile
                ? truncateString(TransactionReceipt?.transaction_hash)
                : TransactionReceipt?.transaction_hash}
            </SectionBoxEntry>

            <SectionBoxEntry title="Block">
              <BlockIdDisplay value={TransactionReceipt?.block_number} />
            </SectionBoxEntry>
          </SectionBox>

          {TransactionDetails?.sender_address || TransactionDetails?.nonce ? (
            <SectionBox title="Sender" variant="upper-half">
              {TransactionDetails?.sender_address ? (
                <SectionBoxEntry title="Address">
                  <AddressDisplay value={TransactionDetails?.sender_address} />
                </SectionBoxEntry>
              ) : (
                <></>
              )}

              {TransactionDetails?.nonce ? (
                <SectionBoxEntry title="Nonce">
                  {Number(TransactionDetails?.nonce)}
                </SectionBoxEntry>
              ) : (
                <></>
              )}
            </SectionBox>
          ) : (
            <></>
          )}

          <SectionBox title="Resource Bounds" variant="upper-half">
            <SectionBoxEntry title="L1 Gas Prices" bold={false}>
              <table className="w-full">
                <tbody>
                  <tr>
                    <th className="w-1/3">Max Amount</th>
                    <td>
                      {TransactionDetails?.resource_bounds?.l1_gas?.max_amount
                        ? formatNumber(
                            Number(
                              cairo.felt(
                                TransactionDetails?.resource_bounds?.l1_gas
                                  ?.max_amount
                              )
                            )
                          )
                        : 0}{" "}
                      WEI
                    </td>
                  </tr>
                  <tr>
                    <th className="w-1">Max Amount / Unit</th>
                    <td>
                      {TransactionDetails?.resource_bounds?.l1_gas
                        ?.max_price_per_unit
                        ? formatNumber(
                            Number(
                              cairo.felt(
                                TransactionDetails?.resource_bounds?.l1_gas
                                  ?.max_price_per_unit
                              )
                            )
                          )
                        : 0}{" "}
                      FRI
                    </td>
                  </tr>
                </tbody>
              </table>
            </SectionBoxEntry>
            <SectionBoxEntry title="L2 Gas Prices" bold={false}>
              <table className="w-full">
                <tbody>
                  <tr>
                    <th className="w-1/3">Max Amount</th>
                    <td>
                      {TransactionDetails?.resource_bounds?.l2_gas?.max_amount
                        ? formatNumber(
                            Number(
                              cairo.felt(
                                TransactionDetails?.resource_bounds?.l2_gas
                                  ?.max_amount
                              )
                            )
                          )
                        : 0}{" "}
                      WEI
                    </td>
                  </tr>
                  <tr>
                    <th className="w-1">Max Amount / Unit</th>
                    <td>
                      {TransactionDetails?.resource_bounds?.l2_gas
                        ?.max_price_per_unit
                        ? formatNumber(
                            Number(
                              cairo.felt(
                                TransactionDetails?.resource_bounds?.l2_gas
                                  ?.max_price_per_unit
                              )
                            )
                          )
                        : 0}{" "}
                      FRI
                    </td>
                  </tr>
                </tbody>
              </table>
            </SectionBoxEntry>
          </SectionBox>

          <SectionBox title="DA Mode" variant="upper-half">
            <table className="w-full">
              <tbody>
                <tr>
                  <th className="w-1/3">Fee</th>
                  <td>{TransactionDetails?.fee_data_availability_mode}</td>
                </tr>
                <tr>
                  <th className="w-1/3">Nonce</th>
                  <td>{TransactionDetails?.nonce_data_availability_mode}</td>
                </tr>
              </tbody>
            </table>
          </SectionBox>

          {TransactionDetails?.tip ? (
            <SectionBox title="Tip" variant="upper-half">
              {TransactionDetails?.tip}
            </SectionBox>
          ) : null}

          <SectionBox title="Actual Fee" variant="upper-half">
            {TransactionReceipt?.actual_fee?.amount
              ? formatNumber(
                  Number(cairo.felt(TransactionReceipt?.actual_fee?.amount))
                )
              : 0}{" "}
            {TransactionReceipt?.actual_fee?.unit}
          </SectionBox>

          <SectionBox title="Execution Resources" variant="full">
            <table className="w-full mb-1">
              <thead>
                <tr>
                  <th colSpan={2}>GAS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th className="w-[90px]">L1 GAS</th>
                  <td>{formatNumber(blockComputeData.gas)}</td>
                </tr>
                <tr>
                  <th className="w-min">L1 DA GAS</th>
                  <td>{formatNumber(blockComputeData.data_gas)}</td>
                </tr>
              </tbody>
            </table>

            <table className="w-full mb-1">
              <thead>
                <tr>
                  <th>STEPS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{formatNumber(blockComputeData.steps)}</td>
                </tr>
              </tbody>
            </table>

            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th colSpan={4} className="p-1 bg-gray-100 border">
                    BUILTINS COUNTER
                  </th>
                </tr>
              </thead>

              <tbody className="text-center">
                {Object.entries(executionData).map(
                  ([key, value], index, array) => {
                    const heading = formatSnakeCaseToDisplayValue(key);
                    return index % 2 === 0 ? (
                      <tr key={index} className="w-full">
                        <th className="w-[111px]">{heading}</th>
                        <td>{formatNumber(value)}</td>

                        {array[index + 1] ? (
                          <>
                            <th className="w-[111px]">
                              {formatSnakeCaseToDisplayValue(
                                array[index + 1][0]
                              )}
                            </th>
                            <td>{formatNumber(array[index + 1][1])}</td>
                          </>
                        ) : (
                          <>
                            <th className="w-[111px]"></th>
                            <td></td>
                          </>
                        )}
                      </tr>
                    ) : null;
                  }
                )}
              </tbody>
            </table>
          </SectionBox>
        </div>

        <div className="bg-white h-full flex-grow grid grid-rows-[min-content_1fr]">
          <DetailsPageSelector
            selected={DataTabs[0]}
            onTabSelect={setSelectedDataTab}
            items={DataTabs.map((tab) => ({
              name: tab,
              value: tab,
            }))}
          />

          <div className="flex-grow flex flex-col gap-3 mt-[6px] px-[15px] py-[17px] border border-borderGray overflow-auto">
            {selectedDataTab === "Calldata" ? (
              <CalldataDisplay calldata={callData} />
            ) : selectedDataTab === "Events" ? (
              <div className="h-full">
                <DataTable
                  table={eventsTable}
                  pagination={eventsPagination}
                  setPagination={setEventsPagination}
                />
              </div>
            ) : selectedDataTab === "Signature" ? (
              <SignatureDisplay signature={TransactionDetails?.signature} />
            ) : selectedDataTab === "Storage Diffs" ? (
              <div className="h-full">
                <DataTable
                  table={storageDiffTable}
                  pagination={storageDiffPagination}
                  setPagination={setStorageDiffPagination}
                />
              </div>
            ) : (
              <div className="h-full p-2 flex items-center justify-center min-h-[150px] text-xs lowercase">
                <span className="text-[#D0D0D0]">No data found</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
