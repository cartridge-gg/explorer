import { useMemo } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { katana } from "@/services/rpc";
import { PageHeader, PageHeaderTitle } from "@/shared/components/PageHeader";
import { Card, CardContent, cn, Spinner } from "@cartridge/ui";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/shared/components/breadcrumb";
import { DataTable } from "./data-table";
import type { TTransactionList } from "@/services/katana";
import { CopyableInteger } from "@/shared/components/copyable-integer";

const columnHelper = createColumnHelper<TTransactionList>();

export function TransactionList() {
  const navigate = useNavigate();

  // Query for transactions using katana
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await katana.getTransactions({
        from: 0,
        to: 5,
        chunkSize: 15,
      });
      return res;
    },
    staleTime: 60 * 1000, // 1 minute
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor("block_number", {
        header: "Block",
        cell: (info) => {
          return (
            <div className="flex items-center gap-2">
              <TransactionIcon className="text-background-500 !w-[38px]" />
              <span className="text-[13px]/[16px] font-semibold tracking-[0.26px] text-foreground-100">
                {info.getValue()}
              </span>
            </div>
          );
        },
        size: 140,
      }),
      columnHelper.accessor("transaction_hash", {
        header: "Hash",
        cell: (info) => {
          return (
            <div className="flex items-center gap-[6px] font-bold text-foreground cursor-pointer transition-all">
              <CopyableInteger
                title={info.getValue()}
                value={info.getValue()}
                length={1}
              />
            </div>
          );
        },
        size: 200,
      }),
      columnHelper.accessor("sender_address", {
        header: "Sender",
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
      columnHelper.accessor("type", {
        header: "Type",
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
    data: transactionsData!,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 3, // Match the 15 rows shown in the image
      },
    },
  });

  return (
    <div className="w-full h-screen flex flex-col gap-[3px] sl:w-[1134px] pb-[20px]">
      <Breadcrumb>
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

      <div className="flex-1 min-h-0">
        {isLoading ? (
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
