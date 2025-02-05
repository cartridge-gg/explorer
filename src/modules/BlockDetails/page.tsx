import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { formatNumber } from "@/shared/utils/number";
import { formatSnakeCaseToDisplayValue } from "@/shared/utils/string";
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
import { useParams } from "react-router-dom";
import DataTable from "./components/EventsTable";
import TransactionsTable from "./components/TransactionsTable";
import EventsTable from "./components/EventsTable";

type TransactionTableData = {
  hash: string;
  type: "INVOKE" | "L1_HANDLER" | "DECLARE" | "DEPLOY" | "DEPLOY_ACCOUNT";
  status: string;
  hash_display: string;
};

type EventTableData = {
  id: string;
  txn_hash: string;
  from: string;
  age: string;
};

const execution_resources_key_map = {
  bitwise_builtin_applications: "bitwise",
  pedersen_builtin_applications: "pedersen",
  range_check_builtin_applications: "range_check",
  poseidon_builtin_applications: "posiedon",
  steps: "steps",
  ecdsa_builtin_applications: "ecdsa",
  segment_arena_builtin: "segment_arena",
  keccak_builtin_applications: "keccak",
  memory_holes: "memory_holes",
};

const columnHelper = createColumnHelper<TransactionTableData>();

const transaction_columns: ColumnDef<TransactionTableData, any>[] = [
  columnHelper.accessor("type", {
    header: "Block Number",
    cell: (info) => `#${info.renderValue()}`,
  }),
  columnHelper.accessor("hash_display", {
    header: "Block Hash",
    cell: (info) => (
      <div className="max-w-[200px] overflow-hidden text-ellipsis">
        {info.renderValue()}
      </div>
    ),
    filterFn: (row, columnId, filterValue) => {
      const rowValue: string = row.getValue(columnId);
      if (filterValue === undefined || filterValue === "All") return true;
      return rowValue.includes(filterValue.toUpperCase());
    },
  }),
  columnHelper.accessor("status", {
    header: "status",
    cell: (info) => {
      return info.renderValue();
    },
  }),
];

const eventColumnHelper = createColumnHelper<EventTableData>();

const event_columns: ColumnDef<EventTableData, any>[] = [
  eventColumnHelper.accessor("id", {
    header: "ID",
    cell: (info) => info.renderValue(),
  }),
  eventColumnHelper.accessor("txn_hash", {
    header: "Transaction Hash",
    cell: (info) => info.renderValue(),
  }),
  eventColumnHelper.accessor("from", {
    header: "From",
    cell: (info) => info.renderValue(),
  }),
  eventColumnHelper.accessor("age", {
    header: "Age",
    cell: (info) => info.renderValue(),
  }),
];

const DataTabs = ["Transactions", "Events", "Messages", "State Updates"];
const TransactionTypeTabs = ["All", "Invoke", "Deploy Account", "Declare"];

export default function BlockDetails() {
  const { blockNumber } = useParams<{ blockNumber: string }>();
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
      hash_display: string;
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
                const key_map = execution_resources_key_map[key];
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
              hash_display: `${
                tx.transaction_hash
              } ( ${formatSnakeCaseToDisplayValue(tx.type)} )`,
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
      setSelectedTransactionType(tab);
    },
    [transaction_table]
  );

  useEffect(() => {
    if (!BlockReceipt) return;

    processBlockInformation(BlockReceipt?.transactions);
  }, [BlockReceipt, processBlockInformation]);

  return (
    <div className="flex flex-col w-full gap-8 px-2 py-4">
      <div className="flex flex-col w-full gap-4">
        <div>
          <h2>. / explrr / blocks / #{blockNumber}</h2>
        </div>

        <div className="flex flex-row justify-between items-center uppercase bg-[#4A4A4A] px-4 py-2">
          <h1 className="text-white">Blocks</h1>
        </div>
        <div className=" flex flex-col lg:flex-row gap-4 py-4">
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
                <p>{BlockReceipt?.block_hash}</p>
              </div>
              <div className="flex flex-col text-sm gap-1">
                <p className=" w-fit font-bold  px-2 py-1 bg-[#D9D9D9] text-black">
                  Number
                </p>
                <p>{BlockReceipt?.block_number}</p>
              </div>
              <div className="flex flex-col text-sm gap-1">
                <p className=" w-fit font-bold  px-2 py-1 bg-[#D9D9D9] text-black">
                  Timestamp
                </p>
                <p>{BlockReceipt?.timestamp} ( Jan 19 2025 22:00:46 )</p>
              </div>
              <div className="flex flex-col text-sm gap-1">
                <p className=" w-fit font-bold  px-2 py-1 bg-[#D9D9D9] text-black">
                  State root
                </p>
                <p>{BlockReceipt?.new_root}</p>
              </div>
              <div className="flex flex-col text-sm gap-1">
                <p className=" w-fit font-bold  px-2 py-1 bg-[#D9D9D9] text-black">
                  Sequencer address
                </p>
                <p>{BlockReceipt?.sequencer_address}</p>
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
                <p className=" w-fit font-bold text-black">GAS PRICE:</p>
                <p>{BlockReceipt?.l1_gas_price?.price_in_fri} FRI</p>
              </div>
              <div className="flex flex-col text-sm gap-1">
                <p className=" w-fit font-bold text-black">DATA GAS PRICE:</p>
                <p>{BlockReceipt?.l1_data_gas_price?.price_in_fri} FRI</p>
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
                    <div className=" w-full block bg-[#8E8E8E] py-2">
                      <p className=" text-white">GAS</p>
                    </div>
                    <div className=" w-full block py-2 border border-[#DBDBDB]">
                      <p>{formatNumber(blockComputeData.gas)}</p>
                    </div>
                  </div>
                  <div className=" flex flex-row w-full">
                    <div className=" w-full block bg-[#8E8E8E] py-2">
                      <p className=" text-white">DA GAS</p>
                    </div>
                    <div className=" w-full block py-2 border border-[#DBDBDB]">
                      <p>{formatNumber(blockComputeData.data_gas)}</p>
                    </div>
                  </div>
                </div>
                <div className=" w-full bg-[#8E8E8E] h-[1px]" />
                <div className=" flex w-full flex-col text-center">
                  <div className=" w-full block bg-[#8E8E8E] py-2">
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
          <div className="border w-full border-[#8E8E8E] flex flex-col gap-4 overflow-hidden">
            <div className="flex flex-row text-center px-4 pt-5">
              {DataTabs.map((tab, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor:
                      selectedDataTab === tab ? "#8E8E8E" : "#fff",
                    color: selectedDataTab === tab ? "#fff" : "#000",
                  }}
                  onClick={() => setSelectedDataTab(tab)}
                  className="w-full  border border-b-4 p-2 border-[#8E8E8E] uppercase cursor-pointer"
                >
                  <p>{tab}</p>
                </div>
              ))}
            </div>

            {selectedDataTab === "Transactions" ? (
              <div className="flex flex-row px-4 text-center">
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

            <div className=" px-2 h-full pb-2">
              {selectedDataTab === "Transactions" ? (
                <TransactionsTable
                  table={transaction_table}
                  pagination={transactionsPagination}
                  setPagination={setTransactionsPagination}
                />
              ) : selectedDataTab === "Events" ? (
                <EventsTable
                  table={events_table}
                  pagination={eventsPagination}
                  setPagination={setEventsPagination}
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
