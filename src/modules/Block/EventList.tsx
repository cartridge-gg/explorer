import { truncateString } from "@/shared/utils/string";
import { EventTableData } from "@/types/types";
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { Link } from "react-router-dom";

interface EventListProps {
  events: EventTableData[];
}

export function EventList({ events }: EventListProps) {
  const columnHelper = createColumnHelper<EventTableData>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: ColumnDef<EventTableData, any>[] = [
    columnHelper.accessor("id", {
      header: () => <th className="w-[52px]">No</th>,
      cell: (info) => info.renderValue(),
    }),
    columnHelper.accessor("txn_hash", {
      header: () => <th className="px-4 text-left">Transaction</th>,
      cell: (info) => truncateString(info.renderValue()),
    }),
    columnHelper.accessor("from", {
      header: () => <th className="px-4 text-left">From Address</th>,
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
                      header.getContext(),
                    ),
                  ),
                )}
            </tr>
          </thead>

          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, id) => (
                <tr key={id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-0">
                      {(() => {
                        switch (cell.column.id) {
                          case "txn_hash":
                            return (
                              <Link
                                to={`../tx/${row.original.txn_hash}`}
                                className="flex px-4 hover:bg-button-whiteInitialHover hover:underline"
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </Link>
                            );
                          case "from":
                            return (
                              <Link
                                to={`../contract/${row.original.from}`}
                                className="flex px-4 hover:bg-button-whiteInitialHover hover:underline"
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </Link>
                            );
                          default:
                            return flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            );
                        }
                      })()}
                    </td>
                  ))}
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
                    prev.pageIndex + 1,
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
