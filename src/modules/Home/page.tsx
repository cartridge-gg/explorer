import { SearchBar } from "@/shared/components/search-bar";
import { useSpecVersion } from "@/shared/hooks/useSpecVersion";
import { Link } from "react-router-dom";
import { Network, Skeleton, cn, Spinner, WedgeIcon } from "@cartridge/ui";
import useChain from "@/shared/hooks/useChain";
import { useQuery } from "@tanstack/react-query";
import { RPC_PROVIDER } from "@/services/rpc";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Header } from "@/shared/components/header";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import type { TTransactionList } from "@/services/katana";
import { CopyableInteger } from "@/shared/components/copyable-integer";
import { useScreen } from "@/shared/hooks/useScreen";
import dayjs from "dayjs";
import { DataTable } from "@/modules/TransactionList/data-table";
import { DataTable as BlockDataTable } from "@/modules/BlockList/data-table";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/shared/components/card";
import type { BlockWithTxHashes } from "starknet";

const transactionColumnHelper = createColumnHelper<TTransactionList>();
const blockColumnHelper = createColumnHelper<BlockWithTxHashes>();

const TABLE_OFFSET = 25; // Offset for the tables
const ROW_HEIGHT = 45;

export function Home() {
  const { id: chainId } = useChain();
  const { data: specVersion } = useSpecVersion();
  const navigate = useNavigate();
  const { isMobile } = useScreen();

  const [tableContainerHeight, setTableContainerHeight] = useState(0);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;
    if (tableContainerHeight !== 0) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { height } = entry.contentRect;
        setTableContainerHeight(Math.max(height, 0));
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [tableContainerHeight]);

  const itemsPerPage = useMemo(() => {
    if (isMobile) return 5;

    if (tableContainerHeight > 0) {
      const calculatedHeight = tableContainerHeight - TABLE_OFFSET;
      return Math.max(1, Math.floor(calculatedHeight / ROW_HEIGHT));
    }
    return 0;
  }, [tableContainerHeight, isMobile]);

  // Get total transactions and blocks
  const { data: totalTxs, isSuccess: isTxSuccess } = useQuery({
    queryKey: ["txlist", "total"],
    queryFn: async () => await RPC_PROVIDER?.transactionNumber?.(),
  });

  const { data: totalBlocks, isSuccess: isBlockSuccess } = useQuery({
    queryKey: ["blocklist", "total"],
    queryFn: async () => await RPC_PROVIDER.getBlockNumber(),
  });

  // Query for transactions
  const { data: transactionsData, isLoading: isLoadingTxs } = useQuery({
    queryKey: ["home", "transactionList", itemsPerPage],
    queryFn: async () => {
      const total = totalTxs ?? 1;
      const res = await RPC_PROVIDER.getTransactions?.({
        from: Math.max(0, total - itemsPerPage),
        to: total,
        chunkSize: itemsPerPage,
      });
      return res;
    },
    staleTime: 60 * 1000,
    enabled: itemsPerPage > 0 && isTxSuccess,
  });

  // Query for blocks
  const { data: blocksData, isLoading: isLoadingBlocks } = useQuery({
    queryKey: ["home", "blockList", itemsPerPage],
    queryFn: async () => {
      const total = totalBlocks ?? 1;
      const res = await RPC_PROVIDER.getBlocks?.({
        from: Math.max(0, total - itemsPerPage),
        to: total,
        chunkSize: itemsPerPage,
      });
      return res;
    },
    staleTime: 60 * 1000,
    enabled: itemsPerPage > 0 && isBlockSuccess,
  });

  const transactions = useMemo(() => {
    return transactionsData?.flat().slice(0, itemsPerPage) ?? [];
  }, [transactionsData, itemsPerPage]);

  const blocks = useMemo(() => {
    return blocksData?.flat().slice(0, itemsPerPage) ?? [];
  }, [blocksData, itemsPerPage]);

  const transactionColumns = useMemo(
    () => [
      transactionColumnHelper.accessor("block_number", {
        header: "Block",
        cell: (info) => {
          return (
            <div className="flex items-center gap-[27px] pl-[19px] w-fit">
              <TransactionIcon className="text-background-500 !w-[38px]" />
              <span className="text-[13px]/[16px] font-semibold tracking-[0.26px] text-foreground-100">
                {info.getValue()}
              </span>
            </div>
          );
        },
        size: 120,
      }),
      transactionColumnHelper.accessor("transaction_hash", {
        header: "Hash",
        cell: (info) => {
          return (
            <CopyableInteger
              title={info.getValue()}
              value={info.getValue()}
              length={1}
            />
          );
        },
        size: 180,
      }),
      transactionColumnHelper.accessor("sender_address", {
        header: "Sender",
        cell: (info) => {
          return (
            <CopyableInteger
              title={info.getValue() as string}
              value={info.getValue()}
              length={1}
            />
          );
        },
        size: 180,
      }),
      transactionColumnHelper.accessor("type", {
        header: "Type",
        cell: (info) => (
          <span className="text-[13px]/[16px] font-semibold tracking-[0.26px] text-foreground-100 capitalize">
            {info.getValue()}
          </span>
        ),
        size: 80,
      }),
    ],
    [],
  );

  const blockColumns = useMemo(
    () => [
      blockColumnHelper.accessor("block_number", {
        header: "Number",
        cell: (info) => {
          return (
            <div className="flex items-center gap-[27px] pl-[19px]">
              <BlockIcon className="text-background-500 !w-[38px]" />
              <span className="text-[13px]/[16px] font-semibold tracking-[0.26px] text-foreground-100">
                {info.getValue()}
              </span>
            </div>
          );
        },
        size: 120,
      }),
      blockColumnHelper.accessor("block_hash", {
        header: "Hash",
        cell: (info) => {
          return (
            <CopyableInteger
              title={info.getValue() as string}
              value={info.getValue()}
              length={1}
            />
          );
        },
        size: 180,
      }),
      blockColumnHelper.accessor("sequencer_address", {
        header: "Sequencer",
        cell: (info) => {
          return (
            <CopyableInteger
              title={info.getValue() as string}
              value={info.getValue()}
              length={1}
            />
          );
        },
        size: 160,
      }),
      blockColumnHelper.accessor("transactions", {
        header: "Total transactions",
        cell: (info) => (
          <span className="text-[13px]/[16px] font-semibold tracking-[0.26px] text-foreground-100 capitalize pl-[10px]">
            {info.getValue().length}
          </span>
        ),
        size: 60,
      }),
      blockColumnHelper.accessor("status", {
        header: "Status",
        cell: (info) => (
          <span className="text-[13px]/[16px] font-semibold tracking-[0.26px] text-foreground-100 capitalize">
            {info.getValue()}
          </span>
        ),
        size: 100,
      }),
      blockColumnHelper.accessor("timestamp", {
        header: "Age",
        cell: (info) => (
          <span className="text-[12px]/[16px] font-normal text-foreground-100 whitespace-nowrap">
            {dayjs.unix(info.getValue()).fromNow()}
          </span>
        ),
        size: 80,
      }),
    ],
    [],
  );

  const transactionTable = useReactTable({
    data: transactions,
    columns: transactionColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: itemsPerPage || 5,
      },
      sorting: [
        {
          id: "block_number",
          desc: true,
        },
      ],
    },
    manualPagination: false,
  });

  const blockTable = useReactTable({
    data: blocks,
    columns: blockColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: itemsPerPage || 5,
      },
      sorting: [
        {
          id: "timestamp",
          desc: true,
        },
      ],
    },
    manualPagination: false,
  });

  const updatePageSize = useCallback(() => {
    if (itemsPerPage > 0) {
      transactionTable.setPageSize(itemsPerPage);
      blockTable.setPageSize(itemsPerPage);
    }
  }, [itemsPerPage, transactionTable, blockTable]);

  useEffect(() => {
    updatePageSize();
  }, [updatePageSize]);

  if (isMobile) {
    return (
      <div className="relative w-full h-full flex flex-col items-center">
        <Header className="py-[20px]" />

        <div className="h-full flex flex-col items-center justify-center gap-2 p-1 w-full sm:w-[520px]">
          <div className="flex gap-2 w-full uppercase text-sm font-bold">
            <div className="px-3 py-1 flex flex-1 items-center bg-background-200 rounded-tl">
              Explorer
            </div>

            {chainId ? (
              <Network
                chainId={chainId.id}
                tooltipTriggerClassName="w-40 bg-background-200 hover:bg-background-300 rounded-none rounded-tr"
              />
            ) : (
              <Skeleton className="w-40 h-10 rounded-none rounded-tr" />
            )}
          </div>

          <SearchBar containerClassName="rounded-t-none" />
        </div>

        <Link
          to="./json-rpc"
          className="absolute bottom-[20px] left-0 flex flex-col uppercase text-sm items-start gap-1"
        >
          <div className="homepage-chain-info-item border border-background-200 h-[20px] flex items-center">
            <span className="font-bold px-2">Starknet JSON-RPC Spec</span>
            <span className="border-l border-background-200 px-2">
              {specVersion || "N/A"}
            </span>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen flex flex-col overflow-hidden pb-[10px]">
      <Header className="py-[20px] flex-shrink-0" />

      <SearchBar
        className="placeholder:text-[12px]/[16px]"
        placeholder="Search blocks / transactions / contracts..."
      />

      <div className="h-full flex flex-col gap-[15px] overflow-hidden mt-[20px]">
        {/* Latest Blocks Card */}
        <Card className="flex-1 flex flex-col gap-0 p-0 rounded-md min-h-0">
          <CardHeader className="p-0 h-[35px] gap-[10px] border-b border-background-200 flex-shrink-0 justify-between">
            <CardTitle className="text-[13px]/[16px] font-normal p-0 pl-[15px]">
              Latest Blocks
            </CardTitle>
            <Link
              to="./blocks"
              className="h-full bg-background-100 hover:bg-background-300 pl-[15px] pr-[10px] border-l border-background-300 text-foreground-300 transition-colors flex items-center gap-[5px]"
            >
              <span className="text-[13px]/[16px] font-normal">View All</span>
              <WedgeIcon
                variant="right"
                className="!w-[20px] !h-[20px] aspect-square"
              />
            </Link>
          </CardHeader>

          <CardContent ref={tableContainerRef} className="flex-1 min-h-0 p-0">
            {isLoadingBlocks ? (
              <div className="flex justify-center items-center h-full">
                <Spinner />
              </div>
            ) : blocks.length ? (
              <BlockDataTable
                table={blockTable}
                onRowClick={(row) => navigate(`./block/${row.block_hash}`)}
                className="h-full border-none"
                showPagination={false}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <span className="text-foreground-300">No blocks available</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest Transactions Card */}
        <Card className="flex-1 flex flex-col gap-0 p-0 rounded-[12px] min-h-0">
          <CardHeader className="p-0 h-[35px] gap-[10px] border-b border-background-200 flex-shrink-0 justify-between">
            <CardTitle className="text-[13px]/[16px] font-normal p-0 pl-[15px]">
              Latest Transactions
            </CardTitle>
            <Link
              to="./txns"
              className="h-full bg-background-100 hover:bg-background-300 pl-[15px] pr-[10px] border-l border-background-300 text-foreground-300 transition-colors flex items-center gap-[5px]"
            >
              <span className="text-[13px]/[16px] font-normal">View All</span>
              <WedgeIcon
                variant="right"
                className="!w-[20px] !h-[20px] aspect-square"
              />
            </Link>
          </CardHeader>

          <CardContent className="flex-1 min-h-0 p-0">
            {isLoadingTxs ? (
              <div className="flex justify-center items-center h-full">
                <Spinner />
              </div>
            ) : transactions.length ? (
              <DataTable
                table={transactionTable}
                onRowClick={(row) => navigate(`./tx/${row.transaction_hash}`)}
                className="h-full border-none"
                showPagination={false}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <span className="text-foreground-300">
                  No transactions available
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/*<Link
        to="./json-rpc"
        className="absolute bottom-[20px] left-4 flex flex-col uppercase text-sm items-start gap-1 flex-shrink-0"
      >
        <div className="homepage-chain-info-item border border-background-200 h-[20px] flex items-center">
          <span className="font-bold px-2">Starknet JSON-RPC Spec</span>
          <span className="border-l border-background-200 px-2">
            {specVersion || "N/A"}
          </span>
        </div>
      </Link>*/}
    </div>
  );
}

const TransactionIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      className={cn(className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 38 39"
      fill="none"
    >
      <path
        d="M13.0872 29.5152L12.6667 29.253L12.2461 29.5152L10.2917 30.7374V8.25898C11.8503 9.23372 12.6419 9.72852 12.6667 9.74336L13.0872 9.48112L15.8333 7.76419L18.5794 9.48112L19 9.74336L19.4206 9.48112L22.1667 7.76419L24.9128 9.48112L25.3333 9.74336C25.3581 9.72852 26.1497 9.23372 27.7083 8.25898V30.7374L25.7539 29.5152L25.3333 29.253L24.9128 29.5152L22.1667 31.2322L19.4206 29.5152L19 29.253L18.5794 29.5152L15.8333 31.2322L13.0872 29.5152ZM9.5 32.1673L12.6667 30.1882L15.8333 32.1673L19 30.1882L22.1667 32.1673L25.3333 30.1882L28.5 32.1673V6.83398L25.3333 8.81315L22.1667 6.83398L19 8.81315L15.8333 6.83398L12.6667 8.81315L9.5 6.83398V32.1673ZM14.25 14.3548H13.8542V15.1465H24.1458V14.3548H14.25ZM13.8542 23.8548V24.6465H24.1458V23.8548H13.8542ZM14.25 19.1048H13.8542V19.8965H24.1458V19.1048H14.25Z"
        fill="#373C38"
      />
    </svg>
  );
};

const BlockIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      className={cn(className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 38 39"
      fill="none"
    >
      <path
        d="M19.3568 32.5031L18.9916 32.2953L8.63524 26.3849L8.26074 26.1725V13.4976L8.63524 13.2851L18.9916 7.37478L19.3568 7.16699L19.7221 7.37478L30.0784 13.2851L30.4529 13.4976V26.1725L30.0784 26.3849L19.7221 32.2953L19.3568 32.5031ZM28.9735 25.3137V15.1922L20.092 20.2575V30.379L28.9735 25.3137ZM24.535 16.0279L28.2245 13.9224L19.3568 8.86161L15.6674 10.9672L24.535 16.0279ZM23.0463 16.8775L14.1787 11.8168L10.4892 13.9224L19.3568 18.9831L23.0463 16.8775ZM18.6171 20.2622L9.74022 15.1968V25.3183L18.6171 30.3837V20.2622Z"
        fill="#373C38"
      />
    </svg>
  );
};
