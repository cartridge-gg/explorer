import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { useNavigate, Link } from "react-router-dom";
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
import { BlockWithTxHashes } from "starknet";
import dayjs from "dayjs";
import { EmptyTransactions } from "@/shared/components/empty/empty-txns";
import { useHasKatanaExtensions } from "@/shared/hooks/useRpcCapabilities";
import { formatSnakeCaseToDisplayValue } from "@/shared/utils/string";

const columnHelper = createColumnHelper<BlockWithTxHashes>();

// Header height = 16 + 5 + 8 = 29px
// Pagination height = 21px
// Gap between cells and pagination = 15px (ignorable)
// Bottom card padding = 20px
// Result = 29 + 21 + 15 + 20 = 85px
const BLOCK_OFFSET = 70; // 85 - 15px for gap
const ROW_HEIGHT = 45;

export function BlockList() {
  const { hasKatanaExtensions, isLoading: capabilitiesLoading } =
    useHasKatanaExtensions();

  const [tableContainerHeight, setTableContainerHeight] = useState(0);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

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
    if (tableContainerHeight > 0) {
      const calculatedHeight = tableContainerHeight - BLOCK_OFFSET;
      return Math.max(1, Math.floor(calculatedHeight / ROW_HEIGHT));
    }
    return 0;
  }, [tableContainerHeight]);

  // Get total blocks
  const { data: totalBlocks, isSuccess } = useQuery({
    queryKey: ["txlist", "total"],
    queryFn: async () => await RPC_PROVIDER.getBlockNumber(),
    enabled: hasKatanaExtensions && !capabilitiesLoading, // Only run if katana extensions are available
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
    enabled: blockItemPerPage > 0 && isSuccess && hasKatanaExtensions, // Only run query when we have calculated page size and katana extensions
  });

  // Flatten all pages into a single array of transactions
  const blocks = useMemo(() => {
    return blocksData?.flat() ?? ([] as BlockWithTxHashes[]);
  }, [blocksData]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("block_number", {
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
        footer: (info) => info.column.id,
        size: 158,
      }),
      columnHelper.accessor("block_hash", {
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
        footer: (info) => info.column.id,
        size: 158,
      }),
      columnHelper.accessor("sequencer_address", {
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
        footer: (info) => info.column.id,
        size: 158,
      }),
      columnHelper.accessor("transactions", {
        header: "Total Transactions",
        cell: (info) => (
          <span className="text-[13px]/[16px] font-semibold tracking-[0.26px] text-foreground-100 capitalize pl-[10px]">
            {info.getValue().length}
          </span>
        ),
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => (
          <span className="text-[13px]/[16px] font-semibold tracking-[0.26px] text-foreground-100 capitalize whitespace-nowrap">
            {formatSnakeCaseToDisplayValue(info.getValue() as string)}
          </span>
        ),
        footer: (info) => info.column.id,
        size: 158,
        meta: {
          align: "right",
        },
      }),
      columnHelper.accessor("timestamp", {
        header: "Timestamp",
        cell: (info) => (
          <span className="text-[12px]/[16px] font-normal text-foreground-100 whitespace-nowrap">
            {dayjs.unix(info.getValue()).fromNow()}
          </span>
        ),
        footer: (info) => info.column.id,
        size: 158,
        meta: {
          align: "right",
        },
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
        pageSize: blockItemPerPage,
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
    <div className="flex-1 min-h-0 w-full lg:max-h-screen h-screen flex flex-col gap-[2px] sl:w-[1134px] pb-[10px]">
      <Breadcrumb className="mb-[8px]">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="..">Explorer</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-foreground-100 text-[12px]/[16px] font-normal">
              Blocks
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        containerClassName="rounded-t-[12px] rounded-b-sm h-[35px]"
        className="px-[15px] py-[8px]"
      >
        <PageHeaderTitle>
          <h1 className="text-[13px]/[16px] font-normal">Blocks</h1>
        </PageHeaderTitle>
      </PageHeader>

      <div ref={tableContainerRef} className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner />
          </div>
        ) : blocks.length ? (
          <DataTable
            table={table}
            onRowClick={(row) => navigate(`../block/${row.block_hash}`)}
            className="h-full"
          />
        ) : (
          <div className="h-full flex flex-col p-[15px] bg-background-100 border border-background-200 rounded-t-[4px] rounded-b-[12px]">
            <EmptyTransactions className="h-full" />
          </div>
        )}
      </div>
    </div>
  );
}

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
