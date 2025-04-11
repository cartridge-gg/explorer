import { useNavigate, useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import { truncateString } from "@/shared/utils/string";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { Block, Contract, getChecksumAddress } from "starknet";
import { isLocalNode } from "@/shared/utils/rpc_utils";
import WalletConnectModal from "@/shared/components/wallet_connect";
import { BreadcrumbPage } from "@cartridge/ui-next";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbSeparator,
} from "@/shared/components/breadcrumbs";
import DetailsPageSelector from "@/shared/components/DetailsPageSelector";
import PageHeader from "@/shared/components/PageHeader";
import { SectionBox } from "@/shared/components/section/SectionBox";
import { SectionBoxEntry } from "@/shared/components/section";
import useBalances from "@/shared/hooks/useBalances";
import ContractReadInterface from "./components/ReadContractInterface";
import ContractWriteInterface from "./components/WriteContractInterface";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useReactTable, getCoreRowModel, flexRender, getPaginationRowModel, ColumnDef, createColumnHelper, getSortedRowModel } from "@tanstack/react-table";

const DataTabs = ["Read Contract", "Write Contract"];
if (isLocalNode) {
  DataTabs.unshift("Events");
}

export default function ContractDetails() {
  const { contractAddress } = useParams<{
    contractAddress: string;
  }>();
  const navigate = useNavigate();
  const { isMobile } = useScreen();
  const [classHash, setClassHash] = useState<string | null>(null);
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

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const fetchContractDetails = useCallback(async () => {
    if (!contractAddress) return;

    // get class hash
    const classHash = await RPC_PROVIDER.getClassHashAt(contractAddress);
    setClassHash(classHash);

    // process contract functions
    const contractClass = await RPC_PROVIDER.getClassAt(contractAddress);

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

  const { balances, isStrkLoading, isEthLoading } =
    useBalances(contractAddress);

  const latestBlockQuery = useQuery({
    queryKey: ["latestBlock"],
    queryFn: () => RPC_PROVIDER.getBlock('latest')
  });

  const blockOffset = 10;
  const fetchOffset = 5;

  type EventDataRaw = { block_number: number, transaction_hash: string };
  type EventData = EventDataRaw & { id: string };

  const eventsQuery = useInfiniteQuery({
    queryKey: ["contract", contractAddress, "events"],
    queryFn: async ({ pageParam }) => {
      const eventsByTX = new Map<string, EventData[]>();
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

        res.events.forEach(e => {
          if (eventsByTX.has(e.transaction_hash)) {
            eventsByTX.get(e.transaction_hash)?.push(e);
          } else {
            eventsByTX.set(e.transaction_hash, [e]);
          }
        })
      }

      return Array.from(eventsByTX.entries())
        .map(([txHash, events]) => events.map((e, i) => ({ ...e, id: `${getChecksumAddress(txHash).toLowerCase()}-${i}` })))
        .flat();
    },
    getNextPageParam: (_lastPage, _allPages, lastPageParam) => ({
      fromBlock: { block_number: lastPageParam.fromBlock.block_number - blockOffset },
      toBlock: { block_number: lastPageParam.toBlock.block_number - blockOffset }
    }),
    initialPageParam: {
      fromBlock: { block_number: latestBlockQuery.data ? latestBlockQuery.data.block_number - blockOffset : undefined } as Block,
      toBlock: { block_number: latestBlockQuery.data ? latestBlockQuery.data.block_number : undefined } as Block,
    },
    initialData: {
      pages: [],
    },
    enabled: contractAddress && !latestBlockQuery.isLoading && isLocalNode
  });

  const eventsColumns: ColumnDef<EventData, any>[] = useMemo(() => {
    const columnHelper = createColumnHelper<EventData>();
    return [
      columnHelper.accessor("id", {
        header: "ID",
        cell: (info) => info.renderValue(),
      }),
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
    <>
      <div className="w-full flex-grow gap-8">
        <div className="mb-2">
          <Breadcrumb>
            <BreadcrumbItem href="/">Explorer</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem href="/">Contracts</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className=" text-sm">
                {isMobile && contractAddress
                  ? truncateString(contractAddress)
                  : contractAddress}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </Breadcrumb>
        </div>

        <PageHeader className="mb-6" title="Contract" />

        <div className="flex flex-col sl:flex-row sl:h-[76vh] gap-4">
          {/* Contract Info Section */}
          <div className="sl:w-[468px] min-w-[468px] flex flex-col gap-[6px] sl:overflow-y-scroll">
            <SectionBox>
              <SectionBoxEntry title="Address">
                {isMobile && contractAddress
                  ? truncateString(contractAddress)
                  : contractAddress}
              </SectionBoxEntry>

              <SectionBoxEntry title="Class Hash">
                {isMobile && classHash ? truncateString(classHash) : classHash}
              </SectionBoxEntry>
            </SectionBox>

            <SectionBox title="Balances">
              <table className="w-full">
                <tbody>
                  <tr>
                    <th className="text-left w-[53px] bg-white font-bold">
                      STRK
                    </th>
                    <td className="text-left">
                      {isStrkLoading
                        ? "0.00"
                        : balances.strk !== undefined
                          ? (Number(balances.strk) / 10 ** 18).toString()
                          : "N/A"}
                    </td>
                  </tr>

                  <tr>
                    <th className="text-left bg-white font-bold">ETH</th>
                    <td className="text-left">
                      {isEthLoading
                        ? "0.00"
                        : balances.eth !== undefined
                          ? (Number(balances.eth) / 10 ** 18).toString()
                          : "N/A"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </SectionBox>
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

            <div className="bg-white flex flex-col gap-3 mt-[6px] px-[15px] py-[17px] border border-borderGray overflow-auto">
              <div className="w-full h-full overflow-auto">
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
                            eventTable.getRowModel().rows.map((row) => (
                              <tr
                                key={row.original.id}
                                onClick={() => navigate(`/events/${row.original.id}`)}
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
                  <ContractReadInterface
                    contract={contract}
                    functions={readFunctions}
                  />
                ) : selectedDataTab === "Write Contract" ? (
                  <ContractWriteInterface
                    contract={contract}
                    functions={writeFunctions}
                  />
                ) : (
                  <div className="h-full p-2 flex items-center justify-center min-h-[150px] text-xs lowercase">
                    <span className="text-[#D0D0D0]">No data found</span>
                  </div>
                )}
              </div>
            </div>
          </div >
        </div >
      </div >

      {/* Wallet Connection Modal */}
      < WalletConnectModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)
        }
      />
    </>
  );
}
