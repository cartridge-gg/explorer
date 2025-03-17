import { useCallback, useState } from "react";
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ROUTES } from "@/constants/routes";
import TxTypeToggle from "./TxTypeToggle";
import { TransactionTableData } from "@/types/types";
import { useNavigate } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import { truncateString } from "@/shared/utils/string";

interface TxListProps {
  transactions: TransactionTableData[];
}

export default function TxList({ transactions }: TxListProps) {
  const navigate = useNavigate();
  const { isMobile } = useScreen();

  const navigateToTxn = useCallback(
    (txnHash: string) => {
      navigate(
        `${ROUTES.TRANSACTION_DETAILS.urlPath.replace(":txHash", txnHash)}`
      );
    },
    [navigate]
  );

  const columnHelper = createColumnHelper<TransactionTableData>();

  const transaction_columns: ColumnDef<TransactionTableData, any>[] = [
    columnHelper.accessor("id", {
      header: "No",
      cell: (info) => info.renderValue(),
    }),
    columnHelper.accessor("hash", {
      header: "Hash",
      cell: (info) => (
        <>
          {isMobile
            ? truncateString(info.renderValue(), 10)
            : info.renderValue()}
        </>
      ),
      filterFn: (row, columnId, filterValue) => {
        const rowValue: string = row.getValue(columnId);
        if (filterValue === undefined || filterValue === "All") return true;
        return rowValue.includes(filterValue.toUpperCase());
      },
    }),
    columnHelper.accessor("type", {
      header: "Type",
      cell: (info) => <span>{info.renderValue()}</span>,
      filterFn: (row, columnId, filterValue) => {
        const rowValue: string = row.getValue(columnId);
        console.log("rowValue", rowValue, filterValue);
        if (filterValue === undefined || filterValue === "All") return true;
        return rowValue.includes(filterValue.toUpperCase());
      },
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => <span>{info.renderValue()}</span>,
    }),
  ];

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });

  const table = useReactTable<TransactionTableData>({
    data: transactions,
    columns: transaction_columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    state: {
      pagination: {
        pageSize: pagination.pageSize,
        pageIndex: pagination.pageIndex,
      },
    },
  });

  const handleTransactionFilter = useCallback(
    (type: string) => {
      const column = table.getColumn("type");
      column?.setFilterValue(type);
      setPagination({
        pageIndex: 0,
        pageSize: 15,
      });
    },
    [table]
  );

  return (
    <div className="flex flex-col gap-2 h-full">
      <TxTypeToggle onFilterChange={(type) => handleTransactionFilter(type)} />

      <div className="h-full flex flex-col gap-2">
        <table className="w-full h-full ">
          <thead className="uppercase">
            <tr>
              {table
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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, id) => (
                <tr
                  key={id}
                  onClick={() => navigateToTxn(row.original.hash)}
                  className="hover:bg-gray-100 cursor-pointer min-h-5"
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td
                        key={cell.id}
                        className={`${
                          cell.column.id === "hash"
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
                <td colSpan={table.getAllColumns().length}>No results found</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-2 h-min flex flex-row gap-4 justify-between items-center">
          <div>
            Showing <strong>{pagination.pageIndex + 1}</strong> of{" "}
            <strong>{table.getPageCount()}</strong> pages
          </div>

          <div className="flex flex-row gap-2">
            <button
              disabled={pagination.pageIndex === 0}
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  pageIndex: Math.max(0, prev.pageIndex - 1),
                }))
              }
              className="bg-[#4A4A4A] text-white px-2 disabled:opacity-50 uppercase"
            >
              Previous
            </button>
            <button
              disabled={pagination.pageIndex === table.getPageCount() - 1}
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  pageIndex: Math.min(
                    table.getPageCount() - 1,
                    prev.pageIndex + 1
                  ),
                }))
              }
              className="bg-[#4A4A4A] text-white px-4 py-[3px] disabled:opacity-50 uppercase"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
