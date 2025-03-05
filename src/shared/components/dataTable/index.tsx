import React from "react";
import { Table as TableType, flexRender } from "@tanstack/react-table";
import { cn } from "@cartridge/ui-next";

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full table-auto border-collapse", className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn("p-2", className)} {...props} />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th ref={ref} className={cn("py-2 font-bold", className)} {...props} />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn("py-2 text-xs", className)} {...props} />
));
TableCell.displayName = "TableCell";

interface DataTableProps<T> {
  table: TableType<T>;
  pagination: { pageIndex: number; pageSize: number };
  setPagination: React.Dispatch<
    React.SetStateAction<{ pageIndex: number; pageSize: number }>
  >;
}

function DataTable<T>({ table, pagination, setPagination }: DataTableProps<T>) {
  return (
    <div className="px-4 flex relative flex-col max-w-screen justify-between h-full sm:w-full w-screen overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="text-xs">
                {row.getVisibleCells().map((cell) => {
                  return flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="h-24 text-center text-sm text-gray-500"
              >
                No results found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex sticky sm:relative bottom-0 left-0 flex-row gap-4 sm:justify-between items-center mt-4">
        <p>
          Showing <strong>{pagination.pageIndex + 1}</strong> of{" "}
          <strong>{table.getPageCount()}</strong> pages
        </p>

        <div className="flex flex-row gap-4">
          <button
            disabled={pagination.pageIndex === 0}
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                pageIndex: Math.max(0, prev.pageIndex - 1),
              }))
            }
            className="bg-[#4A4A4A] text-white px-4 py-2 disabled:opacity-50"
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
            className="bg-[#4A4A4A] text-white px-4 py-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export {
  Table,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  DataTable,
};
