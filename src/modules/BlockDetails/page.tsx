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
import { useCallback, useEffect, useState } from "react";
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
import {
  DataTable,
  TableCell,
  TableHead,
} from "@/shared/components/dataTable";
import { ROUTES } from "@/constants/routes";
import PageHeader from "@/shared/components/PageHeader";
import { SectionBox } from "@/shared/components/section/SectionBox";
import { SectionBoxEntry } from "@/shared/components/section";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/tab";

const columnHelper = createColumnHelper<TransactionTableData>();

const eventColumnHelper = createColumnHelper<EventTableData>();

export default function BlockDetails() {
  const navigate = useNavigate();
  const { blockNumber } = useParams<{ blockNumber: string }>();
  const { isMobile } = useScreen();
  const [transactionsData, setTransactionsData] = useState<
    TransactionTableData[]
  >([]);
  const [eventsData, setEventsData] = useState([]);
  const [executionData, setExecutionData] = useState({
    bitwise: 0,
    pedersen: 0,
    range_check: 0,
    poseidon: 0,
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
      header() {
        return null;
      },
      cell: (info) => (
        <TableCell className="w-1 font-bold text-left pr-4">
          <span>#{info.renderValue()}</span>
        </TableCell>
      ),
    }),
    columnHelper.accessor("hash_display", {
      header() {
        return null;
      },
      cell: (info) => (
        <TableCell
          onClick={() => navigateToTxn(info.renderValue().split(" ")[0])}
          className="w-full px-[16px] text-left hover:text-blue-400 transition-colors cursor-pointer"
        >
          <span className="whitespace-nowrap ">
            {isMobile
              ? truncateString(info.renderValue(), 10)
              : info.renderValue()}
          </span>
        </TableCell>
      ),
      filterFn: (row, columnId, filterValue) => {
        const rowValue: string = row.getValue(columnId);
        if (filterValue === undefined || filterValue === "All") return true;
        return rowValue.includes(filterValue.toUpperCase());
      },
    }),
    columnHelper.accessor("status", {
      header() {
        return null;
      },
      cell: (info) => (
        <TableCell className="w-1 text-right">
          <span>{info.renderValue()}</span>
        </TableCell>
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
      header() {
        return (
          <TableHead className="text-left">
            <span>#</span>
          </TableHead>
        );
      },
      cell: (info) => (
        <TableCell className="w-1 font-bold text-left pr-4">
          <span>#{info.renderValue()}</span>
        </TableCell>
      ),
    }),
    eventColumnHelper.accessor("txn_hash", {
      header() {
        return (
          <TableHead className="text-left">
            <span>Txn Hash</span>
          </TableHead>
        );
      },
      cell: (info) => (
        <TableCell
          onClick={() => navigateToTxn(info.renderValue())}
          className="w-full flex items-center overflow-hidden cursor-pointer pr-4 hover:text-blue-400 transition-all"
        >
          <span className="whitespace-nowrap">
            {isMobile
              ? truncateString(info.renderValue(), 10)
              : info.renderValue()}
          </span>
          <span className="flex-grow border-dotted border-b border-gray-500 mx-2"></span>
        </TableCell>
      ),
    }),
    eventColumnHelper.accessor("from", {
      header() {
        return (
          <TableHead className="text-right">
            <span>From Address</span>
          </TableHead>
        );
      },
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
              hash_display: `${tx.transaction_hash
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
      setTransactionsPagination({
        pageIndex: 0,
        pageSize: 20,
      });
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
            <SectionBoxEntry title="Hash">
              {isMobile
                ? truncateString(BlockReceipt?.block_hash)
                : BlockReceipt?.block_hash}
            </SectionBoxEntry>

            <SectionBoxEntry title="Number">
              {BlockReceipt?.block_number}
            </SectionBoxEntry>

            <SectionBoxEntry title="Timestamp">
              {`${BlockReceipt?.timestamp} (${dayjs
                .unix(BlockReceipt?.timestamp)
                .format("MMM D YYYY HH:mm:ss")})`}
            </SectionBoxEntry>

            <SectionBoxEntry title="State root">
              {isMobile
                ? truncateString(BlockReceipt?.new_root)
                : BlockReceipt?.new_root}
            </SectionBoxEntry>

            <SectionBoxEntry title="Sequencer address">
              {isMobile
                ? truncateString(BlockReceipt?.sequencer_address)
                : BlockReceipt?.sequencer_address}
            </SectionBoxEntry>
          </SectionBox>

          <SectionBox title="Gas Prices" variant="upper-half">
            <SectionBoxEntry title="L1 Gas Prices" bold={false}>
              <table className="w-full">
                <tbody>
                  <tr>
                    <th className="w-[67px]">ETH</th>
                    <td>
                      {BlockReceipt?.l1_gas_price
                        ? formatNumber(
                          Number(
                            cairo.felt(
                              BlockReceipt?.l1_gas_price?.price_in_wei
                            )
                          )
                        )
                        : 0}{" "}
                      WEI
                    </td>
                  </tr>
                  <tr>
                    <th className="w-min">STRK</th>
                    <td>
                      {BlockReceipt?.l1_gas_price
                        ? formatNumber(
                          Number(
                            cairo.felt(
                              BlockReceipt?.l1_gas_price?.price_in_fri
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

            <SectionBoxEntry title="L1 Data Gas Prices" bold={false}>
              <table className="w-full">
                <tbody>
                  <tr>
                    <th className="w-[67px]">ETH</th>
                    <td>
                      {BlockReceipt?.l1_data_gas_price
                        ? formatNumber(
                          Number(
                            cairo.felt(
                              BlockReceipt?.l1_data_gas_price?.price_in_wei
                            )
                          )
                        )
                        : 0}{" "}
                      ETH
                    </td>
                  </tr>
                  <tr>
                    <th className="w-min">STRK</th>
                    <td>
                      {BlockReceipt?.l1_data_gas_price
                        ? formatNumber(
                          Number(
                            cairo.felt(
                              BlockReceipt?.l1_data_gas_price?.price_in_fri
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

        <Tabs defaultValue="transactions" className="border border-borderGray flex flex-col flex-grow p-[15px] rounded-md">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="state-updates">State Updates</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <Tabs defaultValue="all" size="sm" variant="secondary" onValueChange={handleTransactionFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="invoke">Invoke</TabsTrigger>
                <TabsTrigger value="deploy-account">Deploy Account</TabsTrigger>
                <TabsTrigger value="declare">Declare</TabsTrigger>
              </TabsList>
            </Tabs>

            <DataTable
              table={transaction_table}
              pagination={transactionsPagination}
              setPagination={setTransactionsPagination}
              className="p-4"
            />
          </TabsContent>

          <TabsContent value="events" className="p-4">
            <DataTable
              table={events_table}
              pagination={eventsPagination}
              setPagination={setEventsPagination}
            />
          </TabsContent>

          <TabsContent value="messages" className="p-4 text-center">
            <p>No data found</p>
          </TabsContent>

          <TabsContent value="state-updates" className="p-4 text-center">
            <p>No data found</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
