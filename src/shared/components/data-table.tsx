import { Table as TableType, flexRender } from "@tanstack/react-table";
import {
  ArrowIcon,
  ArrowToLineIcon,
  Button,
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@cartridge/ui";

interface DataTableProps<T> extends React.HTMLAttributes<HTMLDivElement> {
  table: TableType<T>;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  table,
  onRowClick,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("h-full flex flex-col", className)}>
      <div className="flex-1 overflow-auto min-h-0">
        <Table className="table-auto w-full">
          <TableHeader className="sticky top-0 bg-background z-10 h-[1px]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-background-200">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="p-2 font-bold text-left text-sm"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  "border-none",
                  onRowClick && "cursor-pointer hover:bg-background-200",
                )}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="p-2 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end mt-4 gap-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
            className="disabled:opacity-30"
          >
            <ArrowToLineIcon variant="left" />
          </Button>
          <Button
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="disabled:opacity-30"
          >
            <ArrowIcon variant="left" />
          </Button>
        </div>
        <div className="text-sm text-foreground-300 font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount() || 1}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="disabled:opacity-30"
          >
            <ArrowIcon variant="right" />
          </Button>
          <Button
            variant="outline"
            disabled={!table.getCanNextPage()}
            onClick={() => table.lastPage()}
            className="disabled:opacity-30"
          >
            <ArrowToLineIcon variant="right" />
          </Button>
        </div>
      </div>
    </div>
  );
}
