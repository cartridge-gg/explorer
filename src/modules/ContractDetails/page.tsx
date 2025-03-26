import { useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import { truncateString } from "@/shared/utils/string";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { Block, Contract } from "starknet";
import { convertValue, isLocalNode } from "@/shared/utils/rpc_utils";
import { FunctionResult, DisplayFormatTypes } from "@/types/types";
import { useAccount, useDisconnect } from "@starknet-react/core";
import WalletConnectModal from "@/shared/components/wallet_connect";
import { BreadcrumbPage } from "@cartridge/ui-next";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/tab";
import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/shared/components/breadcrumbs";
import { Editor } from "@monaco-editor/react";

import DetailsPageSelector from "@/shared/components/DetailsPageSelector";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useReactTable, getCoreRowModel, flexRender, getPaginationRowModel, ColumnDef, createColumnHelper, getSortedRowModel } from "@tanstack/react-table";

const DataTabs = ["Read Contract", "Write Contract", "Contract Code"];
if (isLocalNode) {
  DataTabs.unshift("Events");
}

interface FunctionInput {
  name: string;
  type: string;
  value: string;
}

const DisplayFormat = ["decimal", "hex", "string"];

export default function ContractDetails() {
  const { disconnect } = useDisconnect();
  const { address, account, status } = useAccount();

  const { contractAddress } = useParams<{
    contractAddress: string;
  }>();
  const { isMobile } = useScreen();
  const [classHash, setClassHash] = useState<string | null>(null);
  const [contractABI, setContractABI] = useState<string | undefined>();
  const [sierraProgram, setSierraProgram] = useState<string | undefined>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [readFunctions, setReadFunctions] = useState<
    {
      name: string;
      inputs: { name: string; type: string }[];
      selector: string;
    }[]
  >([]);

  const [selectedDataTab, setSelectedDataTab] = useState(DataTabs[0]);

  const [writeFunctions, setWriteFunctions] = useState<
    {
      name: string;
      inputs: { name: string; type: string }[];
      selector: string;
    }[]
  >([]);

  const [expandedFunctions, setExpandedFunctions] = useState<
    Record<string, FunctionInput[]>
  >({});

  const [functionResults, setFunctionResults] = useState<
    Record<string, FunctionResult<any>>
  >({});

  const [displayFormats, setDisplayFormats] = useState<
    Record<string, DisplayFormatTypes>
  >({});

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const fetchContractDetails = useCallback(async () => {
    if (!contractAddress) return;

    // get class hash
    const classHash = await RPC_PROVIDER.getClassHashAt(contractAddress);
    setClassHash(classHash);

    // process contract functions
    const contractClass = await RPC_PROVIDER.getClassAt(contractAddress);

    setContractABI(JSON.stringify(contractClass.abi, null, 2));
    if ("sierra_program" in contractClass) {
      setSierraProgram(JSON.stringify(contractClass.sierra_program, null, 2));
    }

    const readFuncs: typeof readFunctions = [];
    const writeFuncs: typeof writeFunctions = [];

    contractClass.abi.forEach((item) => {
      if (item.type === "interface") {
        item.items.forEach((func) => {
          if (func.type === "function") {
            const funcData = {
              name: func.name,
              inputs: func.inputs.map((input) => ({
                name: input.name,
                type: input.type,
              })),
              selector: func.selector || "",
            };

            if (
              func.state_mutability === "view" ||
              func.state_mutability === "pure"
            ) {
              readFuncs.push(funcData);
            } else {
              writeFuncs.push(funcData);
            }
          }
        });
      }
    });

    setReadFunctions(readFuncs);
    setWriteFunctions(writeFuncs);

    const contract = new Contract(
      contractClass.abi,
      contractAddress,
      RPC_PROVIDER
    );
    setContract(contract);
  }, [contractAddress]);

  useEffect(() => {
    if (!contractAddress) return;
    fetchContractDetails();
  }, [contractAddress, fetchContractDetails]);

  const handleInputChange = (
    functionName: string,
    inputIndex: number,
    value: string
  ) => {
    setExpandedFunctions((prev) => {
      const functionInputs = [...(prev[functionName] || [])];
      functionInputs[inputIndex] = {
        ...functionInputs[inputIndex],
        value: value,
      };
      return {
        ...prev,
        [functionName]: functionInputs,
      };
    });
  };

  const handleFunctionCall = async (functionName: string) => {
    if (!contract) return;

    // Set loading state
    setFunctionResults((prev) => ({
      ...prev,
      [functionName]: {
        loading: true,
        error: null,
        data: null,
      },
    }));

    try {
      const inputs =
        expandedFunctions[functionName]?.map((input) => input.value) || [];
      const result = await contract.call(functionName, inputs);

      // Update with success result
      setFunctionResults((prev) => ({
        ...prev,
        [functionName]: {
          loading: false,
          error: null,
          data: result,
        },
      }));
    } catch (error) {
      // Update with error
      setFunctionResults((prev) => ({
        ...prev,
        [functionName]: {
          loading: false,
          error: error instanceof Error ? error.message : "An error occurred",
          data: null,
        },
      }));
    }
  };

  const handleWriteFunctionCall = async (functionName: string) => {
    if (!contract || !account) {
      setFunctionResults((prev) => ({
        ...prev,
        [functionName]: {
          loading: false,
          error: "Please connect your wallet first",
          data: null,
        },
      }));
      return;
    }

    setFunctionResults((prev) => ({
      ...prev,
      [functionName]: {
        loading: true,
        error: null,
        data: null,
      },
    }));

    try {
      const inputs =
        expandedFunctions[functionName]?.map((input) => input.value) || [];

      // Execute the transaction using account
      const result = await account.execute([
        {
          contractAddress: contract.address,
          entrypoint: functionName,
          calldata: inputs,
        },
      ]);

      setFunctionResults((prev) => ({
        ...prev,
        [functionName]: {
          loading: false,
          error: null,
          data: result,
        },
      }));
    } catch (error) {
      setFunctionResults((prev) => ({
        ...prev,
        [functionName]: {
          loading: false,
          error: error instanceof Error ? error.message : "An error occurred",
          data: null,
        },
      }));
    }
  };

  const handleFormatChange = (
    functionName: string,
    format: DisplayFormatTypes
  ) => {
    setDisplayFormats((prev) => ({
      ...prev,
      [functionName]: format,
    }));
  };

  const latestBlockQuery = useQuery({
    queryKey: ["latestBlock"],
    queryFn: () => RPC_PROVIDER.getBlock('latest')
  });

  const blockOffset = 10;
  const fetchOffset = 5;
  const eventsQuery = useInfiniteQuery({
    queryKey: ["contract", contractAddress, "events"],
    queryFn: async ({ pageParam }) => {
      const events = [];
      let continuationToken = null;
      while (continuationToken === null || !!continuationToken) {
        const res = await RPC_PROVIDER.getEvents({
          address: contractAddress!,
          chunk_size: 100,
          from_block: pageParam.fromBlock,
          to_block: pageParam.toBlock,
          continuation_token: continuationToken ?? undefined
        });
        continuationToken = res.continuation_token;
        events.push(...res.events);
      }

      return events
    },
    getNextPageParam: (_lastPage, _allPages, lastPageParam) => {
      return {
        fromBlock: { block_number: lastPageParam.fromBlock.block_number - blockOffset },
        toBlock: { block_number: lastPageParam.toBlock.block_number - blockOffset }
      };
    },
    initialPageParam: {
      fromBlock: { block_number: latestBlockQuery.data ? latestBlockQuery.data.block_number - blockOffset : undefined } as Block,
      toBlock: { block_number: latestBlockQuery.data ? latestBlockQuery.data.block_number : undefined } as Block,
    },
    initialData: {
      pages: [],
    },
    enabled: !!contractAddress && !latestBlockQuery.isLoading && isLocalNode
  });

  type EventData = { block_number: number, transaction_hash: string };

  const eventsColumns: ColumnDef<EventData, any>[] = useMemo(() => {
    const columnHelper = createColumnHelper<EventData>();
    return [
      columnHelper.accessor("block_number", {
        header: "Block Number",
        cell: (info) => info.renderValue(),
      }),
      columnHelper.accessor("transaction_hash", {
        header: "Transaction Hash",
        cell: (info) => info.renderValue(),
      }),
    ]
  }, []);
  const [eventPagination, setEventPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });
  const events = useMemo(() => eventsQuery.data?.pages.flat() ?? [], [eventsQuery.data])

  const eventTable = useReactTable({
    data: events,
    columns: eventsColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      sorting: [{
        id: 'block_number',
        desc: true
      }]
    },
    state: {
      pagination: eventPagination,
    }
  });

  useEffect(() => {
    if (
      eventsQuery.isLoading ||
      eventsQuery.isFetching ||
      !eventsQuery.hasNextPage ||
      (eventTable.getPageCount() - (eventPagination.pageIndex + 1)) > fetchOffset) {
      return
    }

    eventsQuery.fetchNextPage()
  }, [eventTable, eventPagination, fetchOffset, eventsQuery])

  return (
    <div className="flex flex-col w-full gap-8">
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
              <BreadcrumbLink className=" text-sm" href="/">
                contracts
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className=" text-sm">
                {isMobile && contractAddress
                  ? truncateString(contractAddress)
                  : contractAddress}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-row justify-between items-center uppercase bg-[#4A4A4A] px-4 py-2">
          <h1 className="text-white">Contract</h1>
        </div>

        <div className="flex flex-col w-full lg:flex-row gap-4 pb-4">
          {/* Contract Info Section */}
          <div className="flex flex-col gap-4">
            <div
              style={{
                borderBottomStyle: "dashed",
                borderBottomWidth: "2px",
              }}
              className="flex flex-col gap-4 p-4 border-[#8E8E8E] border-l-4 border-t border-r"
            >
              <div className="flex flex-col text-sm gap-2">
                <p className="w-fit font-bold px-2 py-1 bg-[#D9D9D9] text-black">
                  Address
                </p>
                <p>
                  {isMobile && contractAddress
                    ? truncateString(contractAddress)
                    : contractAddress}
                </p>
              </div>
              <div className="flex flex-col text-sm gap-2">
                <p className="w-fit font-bold px-2 py-1 bg-[#D9D9D9] text-black">
                  Class Hash
                </p>
                <p>
                  {isMobile && classHash
                    ? truncateString(classHash)
                    : classHash}
                </p>
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

            <div className="flex flex-col gap-3 mt-[6px] px-[15px] py-[17px] border border-borderGray rounded-b-md">
              <div className="w-full h-full">
                {selectedDataTab === "Events" && isLocalNode ? (
                  <div className="flex flex-col gap-4">
                    <div className="h-full flex flex-col gap-2">
                      <table className="w-full h-full">
                        <thead className="uppercase">
                          <tr>
                            {eventTable
                              .getHeaderGroups()
                              .map((headerGroup) =>
                                headerGroup.headers.map((header) => (
                                  <th key={header.id}>
                                    {flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                                  </th>
                                ))
                              )}
                          </tr>
                        </thead>

                        <tbody>
                          {eventTable.getRowModel().rows.length ? (
                            eventTable.getRowModel().rows.map((row, id) => (
                              <tr
                                key={id}
                                // onClick={() => navigateTo(row.original.transaction_hash)}
                                className="hover:bg-gray-100 cursor-pointer min-h-5"
                              >
                                {row.getVisibleCells().map((cell) => {
                                  return (
                                    <td
                                      key={cell.id}
                                      className={`${cell.column.id === "hash"
                                        ? "hover:underline text-left px-[15px]"
                                        : ""
                                        } `}
                                    >
                                      {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={eventTable.getAllColumns().length}>No results found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      <div className="mt-2 h-min flex flex-row gap-4 justify-between items-center">
                        <div>
                          Showing <strong>{eventPagination.pageIndex + 1}</strong> of{" "}
                          <strong>{eventTable.getPageCount()}</strong> pages
                        </div>

                        <div className="flex flex-row gap-2">
                          <button
                            disabled={eventPagination.pageIndex === 0}
                            onClick={() =>
                              setEventPagination((prev) => ({
                                ...prev,
                                pageIndex: Math.max(0, prev.pageIndex - 1),
                              }))
                            }
                            className="bg-[#4A4A4A] text-white px-2 disabled:opacity-50 uppercase"
                          >
                            Previous
                          </button>
                          <button
                            disabled={eventPagination.pageIndex === eventTable.getPageCount() - 1}
                            onClick={() => {
                              setEventPagination((prev) => ({
                                ...prev,
                                pageIndex: Math.min(eventTable.getPageCount() - 1, prev.pageIndex + 1),
                              }));
                            }}
                            className="bg-[#4A4A4A] text-white px-4 py-[3px] disabled:opacity-50 uppercase"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : selectedDataTab === "Read Contract" ? (
                  <div className="flex flex-col gap-4">
                    {readFunctions.map((func, index) => (
                      <div
                        key={index}
                        className="flex flex-col p-4 border border-[#8E8E8E] border-dashed"
                      >
                        <div
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() => {
                            if (!expandedFunctions[func.name]) {
                              setExpandedFunctions((prev) => ({
                                ...prev,
                                [func.name]: func.inputs.map((input) => ({
                                  name: input.name,
                                  type: input.type,
                                  value: "",
                                })),
                              }));
                            } else {
                              setExpandedFunctions((prev) => {
                                const newState = { ...prev };
                                delete newState[func.name];
                                return newState;
                              });
                            }
                          }}
                        >
                          <div className="flex flex-row gap-2 w-full flex-wrap">
                            <p className=" font-bold">{func.name}</p>
                            <div className="flex flex-row gap-2 flex-wrap text-gray-500">
                              (
                              {func.inputs.map((input, idx) => (
                                <p key={idx} className="text-sm">
                                  {idx === 0 ? "" : ","}
                                  {input.name}
                                </p>
                              ))}
                              )
                            </div>
                          </div>
                          <span>
                            {expandedFunctions[func.name] ? "−" : "+"}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2">
                          {expandedFunctions[func.name] && (
                            <div className="flex flex-col gap-4 pt-2">
                              {func.inputs.map((input, idx) => (
                                <div key={idx} className="flex flex-col gap-2">
                                  <label className="text-sm font-medium w-full">
                                    {input.name} ({input.type})
                                  </label>
                                  <input
                                    type="text"
                                    className="border border-[#8E8E8E] p-2"
                                    placeholder={`Enter ${input.type}`}
                                    value={
                                      expandedFunctions[func.name][idx]
                                        ?.value || ""
                                    }
                                    onChange={(e) =>
                                      handleInputChange(
                                        func.name,
                                        idx,
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                              ))}

                              <button
                                className={`px-4 py-2 mt-2 w-fit ${functionResults[func.name]?.loading
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-[#4A4A4A] hover:bg-[#6E6E6E]"
                                  } text-white`}
                                onClick={() => handleFunctionCall(func.name)}
                                disabled={functionResults[func.name]?.loading}
                              >
                                {functionResults[func.name]?.loading
                                  ? "Querying..."
                                  : "Query"}
                              </button>

                              {functionResults[func.name] && (
                                <div className="mt-4">
                                  {functionResults[func.name].loading ? (
                                    <div className="text-gray-600">
                                      Loading...
                                    </div>
                                  ) : functionResults[func.name].error ? (
                                    <div className="text-red-500 p-3 bg-red-50 border border-red-200">
                                      <p className="font-medium">Error:</p>
                                      <p className="text-sm">
                                        {functionResults[func.name].error}
                                      </p>
                                    </div>
                                  ) : functionResults[func.name].data !==
                                    null ? (
                                    <div className="bg-gray-50 p-3 border border-gray-200">
                                      <div className="flex flex-row items-center justify-between mb-4">
                                        <p className="font-medium text-sm">
                                          Result:
                                        </p>
                                        <div className="flex gap-2">
                                          {DisplayFormat.map((format) => (
                                            <button
                                              className={`px-2 py-1 text-xs ${(displayFormats[func.name] ??
                                                "decimal") === format
                                                ? "bg-[#4A4A4A] text-white"
                                                : "bg-gray-200"
                                                }`}
                                              onClick={() =>
                                                handleFormatChange(
                                                  func.name,
                                                  format as DisplayFormatTypes
                                                )
                                              }
                                            >
                                              {format}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                      <pre className="text-sm overflow-x-auto whitespace-pre-wrap break-words">
                                        {(() => {
                                          const data =
                                            functionResults[func.name]?.data;
                                          const format =
                                            displayFormats[func.name] ||
                                            "decimal";

                                          const safeStringify = (value: any) =>
                                            JSON.stringify(
                                              value,
                                              (_, v) =>
                                                typeof v === "bigint"
                                                  ? v.toString()
                                                  : v,
                                              2
                                            );

                                          if (Array.isArray(data)) {
                                            return data.map(
                                              (item: any, index: number) => (
                                                <div
                                                  key={index}
                                                  className="mb-1"
                                                >
                                                  {format === "decimal"
                                                    ? safeStringify(item)
                                                    : convertValue(item)?.[
                                                    format
                                                    ] || safeStringify(item)}
                                                </div>
                                              )
                                            );
                                          }

                                          return (
                                            <div className="mb-1">
                                              {format === "decimal"
                                                ? safeStringify(data)
                                                : convertValue(data)?.[
                                                format
                                                ] || safeStringify(data)}
                                            </div>
                                          );
                                        })()}
                                      </pre>
                                    </div>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedDataTab === "Write Contract" ? (
                  <>
                    <div className="flex justify-between items-center p-4 bg-gray-50 border border-[#8E8E8E] mb-4">
                      <div className="flex flex-col">
                        <p className="text-sm font-medium">Wallet Status</p>
                        <p className="text-sm">
                          {status === "connected" && address
                            ? `Connected: ${truncateString(address)}`
                            : status === "connecting"
                              ? "Connecting..."
                              : "Not Connected"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {status !== "connected" ? (
                          <button
                            onClick={() => setIsWalletModalOpen(true)}
                            className="px-4 py-2 bg-[#4A4A4A] hover:bg-[#6E6E6E] text-white"
                          >
                            Connect Wallet
                          </button>
                        ) : (
                          <button
                            onClick={() => disconnect()}
                            className="px-4 py-2 bg-[#4A4A4A] hover:bg-[#6E6E6E] text-white"
                          >
                            Disconnect
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      {writeFunctions.map((func, index) => (
                        <div
                          key={index}
                          className="flex flex-col p-4 border border-[#8E8E8E] border-dashed"
                        >
                          <div
                            className="flex justify-between items-center cursor-pointer"
                            onClick={() => {
                              if (!expandedFunctions[func.name]) {
                                setExpandedFunctions((prev) => ({
                                  ...prev,
                                  [func.name]: func.inputs.map((input) => ({
                                    name: input.name,
                                    type: input.type,
                                    value: "",
                                  })),
                                }));
                              } else {
                                setExpandedFunctions((prev) => {
                                  const newState = { ...prev };
                                  delete newState[func.name];
                                  return newState;
                                });
                              }
                            }}
                          >
                            <div className="flex flex-row gap-2 w-full flex-wrap">
                              <p className="font-bold">{func.name}</p>
                              <div className="flex flex-row gap-2 flex-wrap text-gray-500">
                                (
                                {func.inputs.map((input, idx) => (
                                  <p key={idx} className="text-sm">
                                    {idx === 0 ? "" : ","}
                                    {input.name}
                                  </p>
                                ))}
                                )
                              </div>
                            </div>
                            <span>
                              {expandedFunctions[func.name] ? "−" : "+"}
                            </span>
                          </div>

                          <div className="flex flex-col gap-2">
                            {expandedFunctions[func.name] && (
                              <div className="flex flex-col gap-4 pt-4">
                                {func.inputs.map((input, idx) => (
                                  <div
                                    key={idx}
                                    className="flex flex-col gap-2"
                                  >
                                    <label className="text-sm font-medium w-full">
                                      {input.name} ({input.type})
                                    </label>
                                    <input
                                      type="text"
                                      className="border border-[#8E8E8E] p-2 "
                                      placeholder={`Enter ${input.type}`}
                                      value={
                                        expandedFunctions[func.name][idx]
                                          ?.value || ""
                                      }
                                      onChange={(e) =>
                                        handleInputChange(
                                          func.name,
                                          idx,
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                ))}

                                <button
                                  className={`px-4 py-2 mt-2 w-fit ${!address
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : functionResults[func.name]?.loading
                                      ? "bg-gray-400 cursor-not-allowed"
                                      : "bg-[#4A4A4A] hover:bg-[#6E6E6E]"
                                    } text-white`}
                                  onClick={() =>
                                    handleWriteFunctionCall(func.name)
                                  }
                                  disabled={
                                    !address ||
                                    functionResults[func.name]?.loading
                                  }
                                >
                                  {!address
                                    ? "Connect Wallet to Execute"
                                    : functionResults[func.name]?.loading
                                      ? "Executing..."
                                      : "Execute"}
                                </button>

                                {functionResults[func.name]?.data
                                  ?.transaction_hash && (
                                    <div className="mt-2 text-sm">
                                      <p className="font-medium">
                                        Transaction Hash:
                                      </p>
                                      <a
                                        href={`/transactions/${functionResults[func.name].data
                                          .transaction_hash
                                          }`}
                                        className="text-blue-600 hover:text-blue-800 break-all"
                                      >
                                        {
                                          functionResults[func.name].data
                                            .transaction_hash
                                        }
                                      </a>
                                    </div>
                                  )}

                                {functionResults[func.name] && (
                                  <div className="mt-4">
                                    {functionResults[func.name].loading ? (
                                      <div className="text-gray-600">
                                        Loading...
                                      </div>
                                    ) : functionResults[func.name].error ? (
                                      <div className="text-red-500 p-3 bg-red-50 border border-red-200">
                                        <p className="font-medium">Error:</p>
                                        <p className="text-sm">
                                          {functionResults[func.name].error}
                                        </p>
                                      </div>
                                    ) : functionResults[func.name].data !==
                                      null ? (
                                      <div className="bg-gray-50 p-3 border border-gray-200">
                                        <p className="font-medium text-sm">
                                          Result:
                                        </p>
                                        <pre className="text-sm overflow-x-auto whitespace-pre-wrap break-words">
                                          {JSON.stringify(
                                            functionResults[func.name].data,
                                            null,
                                            2
                                          )}
                                        </pre>
                                      </div>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : selectedDataTab === "Contract Code" ? (
                  <Tabs
                    defaultValue="abi"
                    className="relative flex flex-col gap-2"
                    variant="secondary"
                    size="sm"
                  >
                    <TabsList className="max-w-md p-0 pb-2">
                      <TabsTrigger value="abi">Contract ABI</TabsTrigger>
                      <TabsTrigger value="sierra">Sierra Bytecode</TabsTrigger>
                    </TabsList>
                    <TabsContent value="abi" className="px-0">
                      <Editor
                        className="min-h-[80vh]"
                        defaultLanguage="json"
                        defaultValue={contractABI}
                      />
                    </TabsContent>
                    <TabsContent value="sierra" className="px-0">
                      <Editor
                        className="min-h-[80vh]"
                        defaultLanguage="javascript"
                        defaultValue={sierraProgram}
                      />
                    </TabsContent>
                  </Tabs>
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

      {/* Wallet Connection Modal */}
      <WalletConnectModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </div >
  );
}
