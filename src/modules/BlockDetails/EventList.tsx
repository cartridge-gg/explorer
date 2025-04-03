import { useScreen } from "@/shared/hooks/useScreen";
import { truncateString } from "@/shared/utils/string";
import { ROUTES } from "@/constants/routes";
import { EventTableData } from "@/types/types";
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

interface EventListProps {
  events: EventTableData[];
}

export default function EventList({ events }: EventListProps) {
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

  const columnHelper = createColumnHelper<EventTableData>();
  const columns: ColumnDef<EventTableData, any>[] = [
    columnHelper.accessor("id", {
      header: () => <th className="w-[52px]">No</th>,
      cell: (info) => info.renderValue(),
    }),
    columnHelper.accessor("txn_hash", {
      header: () => <th className="px-[15px] text-left">Transaction</th>,
      cell: (info) => truncateString(info.renderValue()),
    }),
    columnHelper.accessor("from", {
      header: () => <th className="px-[15px] text-left">From Address</th>,
      cell: (info) => truncateString(info.renderValue()),
    }),
  ];

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });

  const table = useReactTable({
    data: events,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
    },
  });

  return (
    <div className="h-full space-y-3 grid grid-rows-[1fr]">
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
                  className="hover:bg-button-whiteInitialHover cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => {
                    if (cell.column.id === "txn_hash") {
                      return (
                        <td
                          key={cell.id}
                          onClick={() => navigateToTxn(row.original.txn_hash)}
                          className={
                            "hover:underline cursor-pointer text-left px-[15px]"
                          }
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      );
                    } else if (cell.column.id === "from") {
                      return (
                        <td
                          key={cell.id}
                          onClick={() => navigateToContract(row.original.from)}
                          className={
                            "hover:underline cursor-pointer text-left px-[15px]"
                          }
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      );
                    } else {
                      return (
                        <td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      );
                    }
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
