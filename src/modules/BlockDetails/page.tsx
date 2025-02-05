import { ROUTES } from "@/constants/routes";
import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { formatNumber, padNumber } from "@/shared/utils/number";
import { formatVariableToDisplay } from "@/shared/utils/string";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type TransactionTableData = {
  hash: string;
  type: "INVOKE" | "L1_HANDLER" | "DECLARE" | "DEPLOY" | "DEPLOY_ACCOUNT";
  status: string;
  hash_display: string;
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

const columns: ColumnDef<TransactionTableData, any>[] = [
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
  }),
  columnHelper.accessor("status", {
    header: "status",
    cell: (info) => {
      return info.renderValue();
    },
  }),
];

const DataTabs = ["Transactions", "Events", "Messages", "State Updates"];
const TransactionTypeTabs = ["All", "Invoke", "Deploy Account", "Declare"];

export default function BlockDetails() {
  const navigate = useNavigate();
  const { blockNumber } = useParams<{ blockNumber: string }>();
  const [transactionsData, setTransactionsData] = useState<
    TransactionTableData[]
  >([]);
  const [executionData, setExecutionData] = useState({
    bitwise: 0,
    pedersen: 0,
    range_check: 0,
    posiedon: 0,
    steps: 0,
    ecdsa: 0,
    segment_arena: 0,
    keccak: 0,
  });

  const [gasData, setGasData] = useState({
    gas: 0,
    data_gas: 0,
  });

  const { data: BlockReceipt } = useQuery({
    queryKey: [""],
    queryFn: () => RPC_PROVIDER.getBlockWithTxs(blockNumber ?? 0),
    enabled: !!blockNumber,
  });

  const table = useReactTable<TransactionTableData>({
    data: transactionsData,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
            console.log(receipt);

            // process execution resources
            Object.keys(receipt.execution_resources).forEach((key) => {
              if (key === "data_availability") {
                setGasData((prev) => ({
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
              hash_display: `${tx.transaction_hash} ( ${tx.type} )`,
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

  useEffect(() => {
    if (!BlockReceipt) return;

    processBlockInformation(BlockReceipt?.transactions);
  }, [BlockReceipt, processBlockInformation]);

  console.log("executionData", executionData);

  const [selectedDataTab, setSelectedDataTab] = React.useState(DataTabs[0]);

  const [selectedTransactionType, setSelectedTransactionType] = React.useState(
    TransactionTypeTabs[0]
  );

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
                      <p>{formatNumber(gasData.gas)}</p>
                    </div>
                  </div>
                  <div className=" flex flex-row w-full">
                    <div className=" w-full block bg-[#8E8E8E] py-2">
                      <p className=" text-white">DA GAS</p>
                    </div>
                    <div className=" w-full block py-2 border border-[#DBDBDB]">
                      <p>{formatNumber(gasData.data_gas)}</p>
                    </div>
                  </div>
                </div>
                <div className=" w-full bg-[#8E8E8E] h-[1px]" />
                <div className=" flex w-full flex-col text-center">
                  <div className=" w-full block bg-[#8E8E8E] py-2">
                    <p className=" text-white">STEPS</p>
                  </div>
                  <div className=" w-full block py-2 border border-[#DBDBDB]">
                    <p>{formatNumber(executionData.steps)}</p>
                  </div>
                </div>
                <div className=" flex flex-col">
                  <h2 className="text-md font-bold">BUILTINS COUNTER:</h2>
                  <table className="w-full border-collapse mt-2">
                    <tbody className=" text-center w-full">
                      {Object.entries(executionData).map(
                        ([key, value], index, array) => {
                          const heading = formatVariableToDisplay(key);
                          return index % 2 === 0 ? (
                            <tr
                              key={index}
                              className="border-b last:border-b-0 w-full flex"
                            >
                              <td className="p-1 bg-gray-100 w-1/2">
                                {heading}
                              </td>
                              <td className="p-1 w-1/2">
                                {formatNumber(value)}
                              </td>

                              {array[index + 1] && (
                                <>
                                  <td className="p-1 bg-gray-100 w-1/2">
                                    {formatVariableToDisplay(
                                      array[index + 1][0]
                                    )}
                                  </td>
                                  <td className="p-1 w-1/2">
                                    {formatNumber(array[index + 1][1])}
                                  </td>
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
          <div className="border w-full border-[#8E8E8E] flex flex-col gap-4">
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
                  onClick={() => setSelectedTransactionType(tab)}
                  className="w-fit border border-b-4 py-1 px-4 border-[#DBDBDB] uppercase cursor-pointer"
                >
                  <p>{tab}</p>
                </div>
              ))}
            </div>

            <div className=" px-2">
              <table className="w-full table-auto border-collapse">
                <tbody>
                  {table.getRowModel().rows.map((row, index) => (
                    <tr
                      key={row.id}
                      className="text-xs"
                      onClick={() =>
                        navigate(
                          `${ROUTES.TRANSACTION_DETAILS.urlPath.replace(
                            ":txHash",
                            row.original.hash
                          )}`
                        )
                      }
                    >
                      <td className="w-1 p-2 whitespace-nowrap cursor-pointer">
                        <div className="flex items-center overflow-hidden">
                          <span className="whitespace-nowrap font-bold hover:text-blue-400 transition-all">
                            # {padNumber(index + 1)}
                          </span>
                        </div>
                      </td>

                      <td className="w-full p-2 cursor-pointer">
                        <div className="flex items-center overflow-hidden">
                          <span className="whitespace-nowrap hover:text-blue-400 transition-all">
                            {row.original.hash_display}
                          </span>
                          <span className="flex-grow border-dotted border-b border-gray-500 mx-2"></span>
                        </div>
                      </td>

                      <td className="w-1 whitespace-nowrap p-2">
                        <div className="flex items-center">
                          <span className="whitespace-nowrap uppercase text-right">
                            {row.original.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
