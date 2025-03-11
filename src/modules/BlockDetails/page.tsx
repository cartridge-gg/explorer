import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { formatNumber, padNumber } from "@/shared/utils/number";
import {
  formatSnakeCaseToDisplayValue,
  truncateString,
} from "@/shared/utils/string";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EXECUTION_RESOURCES_KEY_MAP } from "@/constants/rpc";
import dayjs from "dayjs";
import { cairo } from "starknet";
import { useScreen } from "@/shared/hooks/useScreen";
import { TransactionTableData, EventTableData } from "@/types/types";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from "@/shared/components/breadcrumbs";
import { DataTable, TableCell, TableHead } from "@/shared/components/dataTable";
import { ROUTES } from "@/constants/routes";
import PageHeader from "@/shared/components/PageHeader";
import DetailsPageContainer from "@/shared/components/DetailsPageContainer";
import { SectionBox } from "@/shared/components/section/SectionBox";
import { SectionBoxEntry } from "@/shared/components/section";
import SelectorHeader, { SelectItem } from "@/shared/components/SelectorHeader";

const columnHelper = createColumnHelper<TransactionTableData>();

const eventColumnHelper = createColumnHelper<EventTableData>();

const DataTabs = ["Transactions", "Events", "Messages", "State Updates"];
const TransactionTypeTabs = ["All", "Invoke", "Deploy Account", "Declare"];

export default function BlockDetails() {
  const navigate = useNavigate();
  const { blockNumber } = useParams<{ blockNumber: string }>();
  const { isMobile } = useScreen();
  const [transactionsData, setTransactionsData] = useState<
    TransactionTableData[]
  >([]);
  const [selectedDataTab, setSelectedDataTab] = React.useState(DataTabs[0]);
  const [selectedTransactionType, setSelectedTransactionType] = React.useState(
    TransactionTypeTabs[0]
  );
  const [eventsData, setEventsData] = useState([]);
  const [executionData, setExecutionData] = useState({
    bitwise: 0,
    pedersen: 0,
    range_check: 0,
    posiedon: 0,
    ecdsa: 0,
    segment_arena: 0,
    keccak: 0,
  });

  const [blockComputeData, setBlockComputeData] = useState({
    gas: 0,
    data_gas: 0,
    steps: 0,
  });

  const [transactionsPagination, setTransactionsPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const [eventsPagination, setEventsPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const { data: BlockReceipt } = useQuery({
    queryKey: [""],
    queryFn: () => RPC_PROVIDER.getBlockWithTxs(blockNumber ?? 0),
    enabled: !!blockNumber,
  });

  const navigateToTxn = useCallback(
    (txnHash: string) => {
      navigate(
        `${ROUTES.TRANSACTION_DETAILS.urlPath.replace(":txHash", txnHash)}`
      );
    },
    [navigate]
  );

  const navigateToContract = useCallback(
    (contractAddress: string) => {
      navigate(
        `${ROUTES.CONTRACT_DETAILS.urlPath.replace(
          ":contractAddress",
          contractAddress
        )}`
      );
    },
    [navigate]
  );

  const transaction_columns: ColumnDef<TransactionTableData, any>[] = [
    columnHelper.accessor("id", {
      header: "No",
      cell: (info) => (
        <TableCell className="w-1 font-bold text-left pr-4">
          <span>#{info.renderValue()}</span>
        </TableCell>
      ),
    }),
    columnHelper.accessor("hash", {
      header: "Hash",
      cell: (info) => (
        <TableCell
          onClick={() => navigateToTxn(info.renderValue())}
          className="w-full hover:underline hover:text-gray-300 cursor-pointer whitespace-nowrap"
        >
          {isMobile
            ? truncateString(info.renderValue(), 10)
            : info.renderValue()}
        </TableCell>
      ),
      filterFn: (row, columnId, filterValue) => {
        const rowValue: string = row.getValue(columnId);
        if (filterValue === undefined || filterValue === "All") return true;
        return rowValue.includes(filterValue.toUpperCase());
      },
    }),
    columnHelper.accessor("type", {
      header: "Type",
      cell: (info) => (
        <TableCell className="w-min">{info.renderValue()}</TableCell>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <TableCell className="w-min capitalize">{info.renderValue()}</TableCell>
      ),
    }),
  ];

  const transaction_table = useReactTable<TransactionTableData>({
    data: transactionsData,
    columns: transaction_columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    state: {
      pagination: {
        pageIndex: transactionsPagination.pageIndex,
        pageSize: transactionsPagination.pageSize,
      },
    },
  });

  const event_columns: ColumnDef<EventTableData, any>[] = [
    eventColumnHelper.accessor("id", {
      header: "No",
      cell: (info) => (
        <TableCell className="w-1 font-bold text-left pr-4">
          <span>#{info.renderValue()}</span>
        </TableCell>
      ),
    }),
    eventColumnHelper.accessor("txn_hash", {
      header: "Transaction",
      cell: (info) => (
        <TableCell
          onClick={() => navigateToTxn(info.renderValue())}
          className="w-full  hover:underline hover:text-gray-300  cursor-pointer pr-4"
        >
          <span className="whitespace-nowrap">
            {isMobile
              ? truncateString(info.renderValue(), 10)
              : info.renderValue()}
          </span>
        </TableCell>
      ),
    }),
    eventColumnHelper.accessor("from", {
      header: "From Address",
      cell: (info) => (
        <TableCell className="w-1 cursor-pointer hover:text-blue-400 transition-all text-right">
          <span onClick={() => navigateToContract(info.renderValue())}>
            {truncateString(info.renderValue())}
          </span>
        </TableCell>
      ),
    }),
  ];

  const events_table = useReactTable({
    data: eventsData,
    columns: event_columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: {
        pageIndex: eventsPagination.pageIndex,
        pageSize: eventsPagination.pageSize,
      },
    },
  });

  const processBlockInformation = useCallback(async (transactions) => {
    if (!transactions) return;

    const transactions_table_data: {
      id: string;
      type: string;
      status: string;
      hash: string;
    }[] = [];
    await Promise.all(
      transactions.map((tx) => {
        return RPC_PROVIDER.getTransactionReceipt(tx.transaction_hash).then(
          (receipt) => {
            // process block events
            if (receipt?.events) {
              receipt.events.forEach((event) => {
                setEventsData((prev) => {
                  return [
                    ...prev,
                    {
                      id: padNumber(prev.length + 1),
                      txn_hash: tx.transaction_hash,
                      from: event.from_address,
                    },
                  ];
                });
              });
            }

            // process execution resources
            Object.keys(receipt?.execution_resources).forEach((key) => {
              if (key === "steps") {
                setBlockComputeData((prev) => ({
                  ...prev,
                  steps: prev.steps + receipt.execution_resources[key],
                }));
              } else if (key === "data_availability") {
                setBlockComputeData((prev) => ({
                  ...prev,
                  gas: prev.gas + receipt.execution_resources[key].l1_data_gas,
                  data_gas:
                    prev.data_gas + receipt.execution_resources[key].l1_gas,
                }));
              } else {
                const key_map = EXECUTION_RESOURCES_KEY_MAP[key];
                if (key_map) {
                  setExecutionData((prev) => ({
                    ...prev,
                    [key_map]: prev[key_map] + receipt.execution_resources[key],
                  }));
                }
              }
            });

            // process info for transactions table
            transactions_table_data.push({
              id: padNumber(transactions_table_data.length + 1),
              // hash_display: `${
              //   tx.transaction_hash
              // } ( ${formatSnakeCaseToDisplayValue(tx.type)} )`,
              type: tx.type,
              status: receipt.statusReceipt,
              hash: tx.transaction_hash,
            });
          }
        );
      })
    );

    setTransactionsData(transactions_table_data);
  }, []);

  const handleTransactionFilter = useCallback(
    (tab: string) => {
      const column = transaction_table.getColumn("hash_display");
      column?.setFilterValue(tab);
      setTransactionsPagination({
        pageIndex: 0,
        pageSize: 20,
      });
      setSelectedTransactionType(tab);
    },
    [transaction_table]
  );

  useEffect(() => {
    if (!BlockReceipt) return;

    processBlockInformation(BlockReceipt?.transactions);
  }, [BlockReceipt, processBlockInformation]);

  return (
    <div className="w-full flex-grow gap-8">
      <Breadcrumb className="mb-3">
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
            <BreadcrumbLink className=" text-sm" href="/blocks">
              blocks
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className=" text-sm">{blockNumber}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        className="mb-6"
        title={`Block #${blockNumber}`}
        subtext={BlockReceipt?.status}
      />

      <div className="flex flex-col sl:flex-row sl:h-[66vh] gap-4">
        <div className="flex flex-col gap-2 sl:overflow-y-scroll">
          <SectionBox variant="upper-half">
            <SectionBoxEntry
              title="Hash"
              value={
                isMobile
                  ? truncateString(BlockReceipt?.block_hash)
                  : BlockReceipt?.block_hash
              }
            />

            <SectionBoxEntry
              title="Number"
              value={BlockReceipt?.block_number}
            />

            <SectionBoxEntry
              title="Timestamp"
              value={`${BlockReceipt?.timestamp} (${dayjs
                .unix(BlockReceipt?.timestamp)
                .format("MMM D YYYY HH:mm:ss")})`}
            />

            <SectionBoxEntry
              title="State root"
              value={
                isMobile
                  ? truncateString(BlockReceipt?.new_root)
                  : BlockReceipt?.new_root
              }
            />

            <SectionBoxEntry
              title="Sequencer address"
              value={
                isMobile
                  ? truncateString(BlockReceipt?.sequencer_address)
                  : BlockReceipt?.sequencer_address
              }
            />
          </SectionBox>

          <SectionBox title="Gas Prices" variant="upper-half">
            <SectionBoxEntry
              title="Gas price"
              value={`${
                BlockReceipt?.l1_gas_price?.price_in_fri
                  ? formatNumber(
                      Number(
                        cairo.felt(BlockReceipt?.l1_gas_price?.price_in_fri)
                      )
                    )
                  : 0
              } FRI`}
            />

            <SectionBoxEntry
              title="Data gas price"
              value={`${
                BlockReceipt?.l1_data_gas_price?.price_in_fri
                  ? formatNumber(
                      Number(
                        cairo.felt(
                          BlockReceipt?.l1_data_gas_price?.price_in_fri
                        )
                      )
                    )
                  : 0
              } FRI`}
            />
          </SectionBox>

          <SectionBox title="Execution Resources" variant="full">
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
          </SectionBox>
        </div>

        <div className="h-full flex-grow grid grid-rows-[min-content_1fr]">
          <SelectorHeader
            selected={DataTabs[0]}
            onTabSelect={setSelectedDataTab}
          >
            {DataTabs.map((tab) => (
              <SelectItem name={tab} />
            ))}
          </SelectorHeader>

          <div className="mt-2 px-[15px] py-[17px] border border-borderGray rounded-md">
            {selectedDataTab === "Transactions" ? (
              <div className="flex flex-row text-center mb-3">
                {TransactionTypeTabs.map((tab, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor:
                        selectedTransactionType === tab ? "#F3F3F3" : "#fff",
                      fontWeight:
                        selectedTransactionType === tab ? "bold" : "normal",
                    }}
                    onClick={() => handleTransactionFilter(tab)}
                    className="w-fit border border-b-4 py-1 px-4 border-[#DBDBDB] uppercase cursor-pointer"
                  >
                    <p>{tab}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="w-full h-full">
              {selectedDataTab === "Transactions" ? (
                <DataTable
                  table={transaction_table}
                  pagination={transactionsPagination}
                  setPagination={setTransactionsPagination}
                />
              ) : selectedDataTab === "Events" ? (
                <DataTable
                  table={events_table}
                  pagination={eventsPagination}
                  setPagination={setEventsPagination}
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
  );
}
