import { EXECUTION_RESOURCES_KEY_MAP } from "@/constants/rpc";
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

const DataTabs = [
  "Calldata",
  "Events",
  "Signature",
  "Internal Calls",
  "Messages",
  "Storage Diffs",
];

type EventData = {
  txn_hash: string;
  from: string;
  block: number;
};

const eventColumnHelper = createColumnHelper<EventData>();
const events_columns = [
  eventColumnHelper.accessor("txn_hash", {
    header: () => "Hash",
    cell: (info) => info.getValue(),
    footer: (info) => info.column.id,
  }),
  eventColumnHelper.accessor("from", {
    header: "from",
    cell: (info) => {
      const date = Number(info.getValue());
      return date;
    },
  }),
  eventColumnHelper.accessor("block", {
    header: "block",
    cell: (info) => {
      const date = Number(info.getValue());
      return date;
    },
  }),
];

const storageDiffColumnHelper = createColumnHelper<any>();
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
  });

  const [blockComputeData, setBlockComputeData] = useState({
    gas: 0,
    data_gas: 0,
    steps: 0,
  });

  const [eventsData, setEventsData] = useState([]);
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
    // process events
    if (TransactionReceipt?.events) {
      TransactionReceipt.events.forEach((event) => {
        setEventsData((prev) => {
          return [
            ...prev,
            {
              txn_hash: TransactionReceipt.transaction_hash,
              from: event.from_address,
              block: TransactionReceipt.block_number,
            },
          ];
        });
      });
    }

    // process execution resources
    Object.keys(TransactionReceipt?.execution_resources).forEach((key) => {
      const receipt = TransactionReceipt?.execution_resources;
      if (key === "steps") {
        setBlockComputeData((prev) => ({
          ...prev,
          steps: prev.steps + receipt[key],
        }));
      } else if (key === "data_availability") {
        setBlockComputeData((prev) => ({
          ...prev,
          gas: prev.gas + receipt[key].l1_data_gas,
          data_gas: prev.data_gas + receipt[key].l1_gas,
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
  }, [TransactionReceipt]);

  useEffect(() => {
    if (!TransactionReceipt) return;
    processTransactionReceipt();
  }, [TransactionReceipt, processTransactionReceipt]);

  const processTransactionTrace = useCallback(async () => {
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
  }, [TransactionTrace, TransactionReceipt]);

  useEffect(() => {
    if (!TransactionTrace || !TransactionReceipt) return;
    processTransactionTrace();
  }, [TransactionReceipt, processTransactionTrace, TransactionTrace]);

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
        <div>
          <h2>
            . / explrr / transactions /{" "}
            {isMobile && txHash ? truncateString(txHash) : txHash}
          </h2>
        </div>

        <div className="flex flex-row justify-between items-center uppercase bg-[#4A4A4A] px-4 py-2">
          <h1 className="text-white">Transactions</h1>
        </div>
        <div className=" flex flex-col lg:flex-row gap-4 pb-4">
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
                <p>{BlockDetails?.timestamp}</p>
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
                    ? truncateString(TransactionDetails?.transaction_hash)
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
                <p className=" w-fit font-bold text-black">GAS PRICE:</p>
                <p>{TransactionReceipt?.actual_fee?.amount} FRI</p>
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
                      <p>{blockComputeData.gas}</p>
                    </div>
                  </div>
                  <div className=" flex flex-row w-full">
                    <div className=" w-full block bg-[#8E8E8E] py-2">
                      <p className=" text-white">DA GAS</p>
                    </div>
                    <div className=" w-full block py-2 border border-[#DBDBDB]">
                      <p>{blockComputeData.data_gas}</p>
                    </div>
                  </div>
                </div>
                <div className=" w-full bg-[#8E8E8E] h-[1px]" />
                <div className=" flex w-full flex-col text-center">
                  <div className=" w-full block bg-[#8E8E8E] py-2">
                    <p className=" text-white">STEPS</p>
                  </div>
                  <div className=" w-full block py-2 border border-[#DBDBDB]">
                    <p>{blockComputeData.steps}</p>
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

            <div className=" px-2 h-full pb-2">
              {selectedDataTab === "Events" ? (
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
