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
      header: () => <th className="w-[52px]">No</th>,
      cell: (info) => info.renderValue(),
    }),
    columnHelper.accessor("hash", {
      header: () => <th className="px-[15px] text-left">Hash</th>,
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
      header: () => <th className="w-[122px] px-[15px] text-left">Type</th>,
      cell: (info) => (
        <span className="text-nowrap">
          {info.renderValue().replace(/_/g, " ")}
        </span>
      ),
      filterFn: (row, columnId, filterValue) => {
        const rowValue: string = row.getValue(columnId);
        if (filterValue === undefined || filterValue === "All") return true;
        return rowValue.includes(filterValue.toUpperCase());
      },
    }),
    columnHelper.accessor("status", {
      header: (ctx) => (
        <th key={ctx.header.id} className="px-[15px] text-left w-[103px]">
          Status
        </th>
      ),
      cell: (info) => (
        <div
          className={`flex items-center justify-center border border-primary uppercase font-bold text-white px-2 py-0 h-[15px] text-sm w-[67px] ${
            info.renderValue() === "SUCCEEDED"
              ? "bg-[#7BA797]"
              : info.renderValue() === "REVERTED"
              ? "bg-[#C4806D]"
              : ""
          }`}
        >
          {info.renderValue()}
        </div>
      ),
    }),
  ];

  // Calculate pageSize based on window height
  const calculatePageSize = useCallback(() => {
    // Fixed component height and row height
    const componentHeight = height * 0.55; // 55% of the screen height (computed by hand)
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
                  headerGroup.headers.map((header) =>
                    flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )
                  )
                )}
            </tr>
          </thead>

          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, id) => (
                <tr
                  key={id}
                  onClick={() => navigateToTxn(row.original.hash)}
                  className="hover:bg-button-whiteInitialHover cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td
                        key={cell.id}
                        className={`text-left px-[15px] ${
                          cell.column.id === "hash"
                            ? "hover:underline "
                            : cell.column.id === "id"
                            ? "text-center"
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

        <div className="mt-2 h-min grid grid-cols-[max-content_max-content] items-center justify-between">
          <div>
            Showing <strong>{pagination.pageIndex + 1}</strong> of{" "}
            <strong>{table.getPageCount()}</strong> pages
          </div>

          {table.getPageCount() > 1 ? (
            <div className="gap-2 h-[20px] font-bold grid grid-cols-2 w-[145px] select-none">
              {pagination.pageIndex !== 0 ? (
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      pageIndex: Math.max(0, prev.pageIndex - 1),
                    }))
                  }
                  className="bg-white px-4 disabled:opacity-50 uppercase border border-borderGray disabled:hover:bg-white disabled:hover:border disabled:hover:text-inherit hover:bg-primary hover:border-0 hover:text-white"
                >
                  Prev
                </button>
              ) : (
                <></>
              )}

              <button
                // disable the next button when it's on the last page
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
                className="bg-white px-4 disabled:opacity-50 uppercase border border-borderGray col-start-2 disabled:hover:bg-white disabled:hover:border disabled:hover:text-inherit hover:bg-primary hover:border-0 hover:text-white"
              >
                Next
              </button>
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
}
