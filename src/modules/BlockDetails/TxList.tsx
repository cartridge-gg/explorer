import { useCallback, useState, useEffect, useMemo } from "react";
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
import { useWindowDimensions } from "@/shared/hooks/useWindow";

interface TxListProps {
  transactions: TransactionTableData[];
}

export default function TxList({ transactions }: TxListProps) {
  const navigate = useNavigate();
  const { isMobile } = useScreen();
  const { height } = useWindowDimensions();

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
        if (filterValue === undefined || filterValue === "All") return true;
        return rowValue.includes(filterValue.toUpperCase());
      },
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => <span>{info.renderValue()}</span>,
    }),
  ];

  // Calculate pageSize based on window height
  const calculatePageSize = useCallback(() => {
    // Fixed component height and row height
    const componentHeight = height * 0.5; // 50% of the screen height (computed by hand)
    const rowHeight = 20;

    // Calculate how many rows can fit in the available height
    const availableHeight = componentHeight;
    const calculatedPageSize = Math.max(
      5,
      Math.floor(availableHeight / rowHeight)
    );

    return calculatedPageSize;
  }, [height]);

  // Memoize the page size calculation value
  const pageSize = useMemo(calculatePageSize, [calculatePageSize]);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize,
  });

  // Update pageSize when window height changes
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageSize,
    }));
  }, [pageSize]);

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
        pageSize,
      });
    },
    [table, pageSize]
  );

  return (
    <div className="h-full space-y-3 grid grid-rows-[min-content_1fr]">
      <TxTypeToggle onFilterChange={(type) => handleTransactionFilter(type)} />

      <div className="grid grid-rows-[1fr_min-content] gap-3">
        <table className="w-full h-min">
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
                  className="hover:bg-gray-100 cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td
                        key={cell.id}
                        className={`${
                          cell.column.id === "hash"
                            ? "hover:underline text-left px-[15px] "
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
