import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { RPC_PROVIDER } from "@/services/rpc";
import { PageHeader, PageHeaderTitle } from "@/shared/components/PageHeader";
import { cn, Spinner } from "@cartridge/ui";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/shared/components/breadcrumb";
import { DataTable } from "./data-table";
import { CopyableInteger } from "@/shared/components/copyable-integer";
import { useScreen } from "@/shared/hooks/useScreen";
import * as RPC08 from "@starknet-io/types-js";

const columnHelper = createColumnHelper<RPC08.BlockWithTxs>();

const BLOCK_OFFSET = 56; // Offset for the blocks table
const ROW_HEIGHT = 45;

export function BlockList() {
  const [tableContainerHeight, setTableContainerHeight] = useState(0);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { isMobile } = useScreen();

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;
    if (tableContainerHeight !== 0) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { height } = entry.contentRect;
        setTableContainerHeight(Math.max(height, 0)); // Ensure non-negative
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [tableContainerHeight]);

  const blockItemPerPage = useMemo(() => {
    if (isMobile) return 5;

    if (tableContainerHeight > 0) {
      const calculatedHeight = tableContainerHeight - BLOCK_OFFSET;
      return Math.max(1, Math.floor(calculatedHeight / ROW_HEIGHT));
    }
    return 0;
  }, [tableContainerHeight, isMobile]);

  // Get total blocks
  const { data: totalBlocks, isSuccess } = useQuery({
    queryKey: ["txlist", "total"],
    queryFn: async () => await RPC_PROVIDER.getBlockNumber(),
  });

  // Query for transactions using katana
  const { data: blocksData, isLoading } = useQuery({
    queryKey: ["blockList", blockItemPerPage],
    queryFn: async () => {
      const total = totalBlocks ?? 1;
      const res = await RPC_PROVIDER.getBlocks?.({
        from: 0,
        to: total,
        chunkSize: total,
      });
      return res;
    },
    staleTime: 60 * 1000, // 1 minute
    enabled: blockItemPerPage > 0 && isSuccess, // Only run query when we have calculated page size
  });

  // Flatten all pages into a single array of transactions
  const blocks = useMemo(() => {
    return blocksData?.flat() ?? [];
  }, [blocksData]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("block_number", {
        header: "Number",
        cell: (info) => {
          return (
            <div className="flex items-center gap-[27px] pl-[19px]">
              <TransactionIcon className="text-background-500 !w-[38px]" />
              <span className="text-[13px]/[16px] font-semibold tracking-[0.26px] text-foreground-100">
                {info.getValue()}
              </span>
            </div>
          );
        },
        size: 140,
      }),
      columnHelper.accessor("block_hash", {
        header: "Hash",
        cell: (info) => {
          return (
            <div className="flex items-center gap-[6px] font-bold text-foreground cursor-pointer transition-all">
              <CopyableInteger
                title={info.getValue() as string}
                value={info.getValue()}
                length={1}
              />
            </div>
          );
        },
        size: 200,
      }),
      columnHelper.accessor("sequencer_address", {
        header: "Sequencer",
        cell: (info) => {
          return (
            <div className="flex items-center gap-[6px] font-bold text-foreground cursor-pointer transition-all">
              <CopyableInteger
                title={info.getValue() as string}
                value={info.getValue()}
                length={1}
              />
            </div>
          );
        },
        size: 200,
      }),
      columnHelper.accessor("transactions", {
        header: "Transactions",
        cell: (info) => (
          <span className="text-[13px]/[16px] font-semibold tracking-[0.26px] text-foreground-100 capitalize">
            {info.getValue().length}
          </span>
        ),
        size: 100,
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => (
          <span className="text-[13px]/[16px] font-semibold tracking-[0.26px] text-foreground-100 capitalize">
            {info.getValue()}
          </span>
        ),
        size: 100,
      }),
      columnHelper.accessor("timestamp", {
        header: "Timestamp",
        cell: (info) => (
          <span className="text-[13px]/[16px] font-semibold tracking-[0.26px] text-foreground-100 capitalize">
            {info.getValue()}
          </span>
        ),
        size: 100,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: blocks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: blockItemPerPage || 5,
      },
    },
    manualPagination: false,
  });

  // Update table page size when txnItemPerPage changes
  const updatePageSize = useCallback(() => {
    if (blockItemPerPage > 0) {
      table.setPageSize(blockItemPerPage);
    }
  }, [blockItemPerPage, table]);

  useEffect(() => {
    updatePageSize();
  }, [updatePageSize]);

  return (
    <div className="w-full lg:max-h-screen h-screen flex flex-col gap-[2px] sl:w-[1134px] pb-[20px]">
      <Breadcrumb className="mb-[8px]">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="..">Explorer</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-foreground-100 text-[12px]/[16px] font-normal">
              Transactions
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        containerClassName="rounded-t-[12px] rounded-b-sm h-[35px]"
        className="px-[15px] py-[8px]"
      >
        <PageHeaderTitle>
          <h1 className="text-[13px]/[16px] font-normal">Transactions</h1>
        </PageHeaderTitle>
      </PageHeader>

      <div ref={tableContainerRef} className="flex-1 min-h-0">
        {isLoading && blocks.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <Spinner />
          </div>
        ) : (
          <DataTable
            table={table}
            onRowClick={(row) => navigate(`../tx/${row.transaction_hash}`)}
            className="h-full"
          />
        )}
      </div>
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
