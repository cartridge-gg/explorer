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
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import { cairo, CallData, events as eventsLib } from "starknet";
import {
  decodeCalldata,
  getEventName,
  initBlockComputeData,
  initExecutions,
  parseExecutionResources,
} from "@/shared/utils/rpc_utils";
import CalldataDisplay from "./components/CalldataDisplay";
import { CACHE_TIME, STALE_TIME } from "@/constants/rpc";
import {
  Breadcrumb,
  BreadcrumbSeparator,
  BreadcrumbItem,
} from "@/shared/components/breadcrumbs";
import { DataTable } from "@/shared/components/dataTable";
import DetailsPageSelector from "@/shared/components/DetailsPageSelector";
import PageHeader from "@/shared/components/PageHeader";
import { SectionBoxEntry } from "@/shared/components/section";
import { SectionBox } from "@/shared/components/section/SectionBox";
import dayjs from "dayjs";
import SignatureDisplay from "./components/SignatureDisplay";
import AddressDisplay from "@/shared/components/AddressDisplay";
import BlockIdDisplay from "@/shared/components/BlockIdDisplay";
import { cn } from "@cartridge/ui-next";
import { useBlock } from "@starknet-react/core";
import TxType from "./components/TxType";

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

export function Transaction() {
  const navigate = useNavigate();
  const { txHash } = useParams<{ txHash: string }>();
  const { isMobile } = useScreen();

  const [selectedDataTab, setSelectedDataTab] = useState(DataTabs[0]);

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
  } = useQuery<{
    tx?: Awaited<ReturnType<typeof RPC_PROVIDER.getTransaction>>;
    calldata: { contract: string; selector: string; args: string[] }[];
  }>({
    queryKey: ["transaction", "calldata", txHash],
    queryFn: async () => {
      const tx = await RPC_PROVIDER.getTransaction(txHash || "");
      return {
        tx,
        calldata: "calldata" in tx ? decodeCalldata(tx.calldata) : [],
      };
    },
    enabled: typeof txHash === "string",
    initialData: {
      tx: undefined,
      calldata: [],
    },
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
            <span className="whitespace-nowrap hover:text-blue-400 transition-all">
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
            className="w-1 text-right border-0 cursor-pointer hover:text-blue-400 transition-all"
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

  return (
    <div id="tx-details" className="w-full flex-grow gap-8">
      <div className="mb-2">
        <Breadcrumb>
          <BreadcrumbItem to="..">Explorer</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem to="../txns">Transactions</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {isMobile && txHash ? truncateString(txHash) : txHash}
          </BreadcrumbItem>
        </Breadcrumb>
      </div>

      <PageHeader
        className="mb-6"
        title={`Transaction`}
        subtext={receipt?.finality_status}
        titleRightComponent={
          <div className="flex gap-2">
            {receipt?.type ? <TxType type={receipt?.type} /> : null}

            <div
              className={cn(
                "text-white px-2 h-5 w-[84px] flex items-center justify-center font-bold",
                receipt
                  ? receipt?.isSuccess()
                    ? "bg-[#7BA797]"
                    : "bg-[#C4806D]"
                  : undefined,
              )}
            >
              {receipt?.execution_status}
            </div>
          </div>
        }
        subtextRightComponent={
          <div className="text-[#5D5D5D]">
            {dayjs.unix(block?.timestamp).format("MMM D YYYY HH:mm:ss")}{" "}
          </div>
        }
      />

      <div className="flex flex-col sl:flex-row sl:h-[73vh] gap-4">
        <div className="sl:w-[468px] sl:min-w-[468px] flex flex-col gap-[6px] sl:overflow-y-scroll">
          <SectionBox variant="upper-half">
            <SectionBoxEntry title="Hash">
              {isMobile
                ? truncateString(receipt?.transaction_hash)
                : receipt?.transaction_hash}
            </SectionBoxEntry>

            <SectionBoxEntry title="Block">
              <BlockIdDisplay value={receipt?.block_number} />
            </SectionBoxEntry>
          </SectionBox>

          {(!!tx?.sender_address || !!tx?.nonce) && (
            <SectionBox title="Sender" variant="upper-half">
              {!!tx?.sender_address && (
                <SectionBoxEntry title="Address">
                  <AddressDisplay value={tx?.sender_address} />
                </SectionBoxEntry>
              )}

              {!!tx?.nonce && (
                <SectionBoxEntry title="Nonce">
                  {Number(tx?.nonce)}
                </SectionBoxEntry>
              )}
            </SectionBox>
          )}

          <SectionBox title="Resource Bounds" variant="upper-half">
            <SectionBoxEntry title="L1 Gas Prices" bold={false}>
              <table className="w-full">
                <tbody>
                  <tr>
                    <th className="w-1/3">Max Amount</th>
                    <td>
                      {tx?.resource_bounds?.l1_gas?.max_amount
                        ? formatNumber(
                            Number(
                              cairo.felt(
                                tx?.resource_bounds?.l1_gas?.max_amount,
                              ),
                            ),
                          )
                        : 0}{" "}
                      WEI
                    </td>
                  </tr>
                  <tr>
                    <th className="w-1">Max Amount / Unit</th>
                    <td>
                      {tx?.resource_bounds?.l1_gas?.max_price_per_unit
                        ? formatNumber(
                            Number(
                              cairo.felt(
                                tx?.resource_bounds?.l1_gas?.max_price_per_unit,
                              ),
                            ),
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
                      {tx?.resource_bounds?.l2_gas?.max_amount
                        ? formatNumber(
                            Number(
                              cairo.felt(
                                tx?.resource_bounds?.l2_gas?.max_amount,
                              ),
                            ),
                          )
                        : 0}{" "}
                      WEI
                    </td>
                  </tr>
                  <tr>
                    <th className="w-1">Max Amount / Unit</th>
                    <td>
                      {tx?.resource_bounds?.l2_gas?.max_price_per_unit
                        ? formatNumber(
                            Number(
                              cairo.felt(
                                tx?.resource_bounds?.l2_gas?.max_price_per_unit,
                              ),
                            ),
                          )
                        : 0}{" "}
                      FRI
                    </td>
                  </tr>
                </tbody>
              </table>
            </SectionBoxEntry>
          </SectionBox>

          {tx?.fee_data_availability_mode ||
          tx?.nonce_data_availability_mode ? (
            <SectionBox title="DA Mode" variant="upper-half">
              <table className="w-full">
                <tbody>
                  {tx?.fee_data_availability_mode ? (
                    <tr>
                      <th className="w-1/3">Fee</th>
                      <td>{tx.fee_data_availability_mode}</td>
                    </tr>
                  ) : null}

                  {tx?.nonce_data_availability_mode ? (
                    <tr>
                      <th className="w-1/3">Nonce</th>
                      <td>{tx.nonce_data_availability_mode}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </SectionBox>
          ) : null}

          {tx?.tip ? (
            <SectionBox title="Tip" variant="upper-half">
              {tx.tip}
            </SectionBox>
          ) : null}

          <SectionBox title="Actual Fee" variant="upper-half">
            {receipt?.actual_fee?.amount
              ? formatNumber(Number(cairo.felt(receipt?.actual_fee?.amount)))
              : 0}{" "}
            {receipt?.actual_fee?.unit}
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
                {Object.entries(executions).map(
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
                                array[index + 1][0],
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
                  },
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
            {(() => {
              switch (selectedDataTab) {
                case "Calldata":
                  return <CalldataDisplay calldata={calldata} />;
                case "Events":
                  return (
                    <div className="h-full">
                      <DataTable
                        table={eventsTable}
                        pagination={eventsPagination}
                        setPagination={setEventsPagination}
                      />
                    </div>
                  );
                case "Signature":
                  return <SignatureDisplay signature={tx?.signature} />;
                case "Storage Diffs":
                  return (
                    <div className="h-full">
                      <DataTable
                        table={storageDiffTable}
                        pagination={storageDiffPagination}
                        setPagination={setStorageDiffPagination}
                      />
                    </div>
                  );
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
