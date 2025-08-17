import { Table as TableType, flexRender } from "@tanstack/react-table";
import {
  ArrowIcon,
  ArrowToLineIcon,
  Button,
  cn,
  Spinner,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@cartridge/ui";
import { Table } from "@/shared/components/primitives/table";

interface DataTableProps<T> extends React.HTMLAttributes<HTMLDivElement> {
  table: TableType<T>;
  onRowClick?: (row: T) => void;
  containerClassName?: string;
  tableClassName?: string;
  isLoadingMore?: boolean;
  onNextPage?: () => void;
}

export function DataTable<T>({
  table,
  onRowClick,
  containerClassName,
  tableClassName,
  className,
  isLoadingMore,
  ...props
}: DataTableProps<T>) {
  return (
    <div
      {...props}
      className={cn(
        "h-full flex flex-col px-[10px] pt-[8px] pb-[20px] bg-background-100 border border-background-200 rounded-t-[4px] rounded-b-[12px]",
        className,
      )}
    >
      <div className="flex-1 min-h-0 mb-[15px]">
        <Table
          containerClassName={cn(containerClassName)}
          className={cn(
            "relative table-auto w-full h-full overflow-auto",
            tableClassName,
          )}
        >
          <TableHeader className="sticky top-0 z-[20] bg-background-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-none">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "h-auto p-0 align-top text-[12px]/[16px] font-normal tracking-[0.24px] text-foreground-300 first:pl-[80px] last:pr-[15px]",
                      header.column.id.toLowerCase() === "type"
                        ? "text-right pr-[38px]"
                        : "text-left",
                    )}
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
          <div className="bg-background-100 w-full h-[5px]" />
          <TableBody className="select-none">
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="border-b border-background-100 bg-background-150 hover:bg-background-100 cursor-pointer"
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      "text-sm p-0 border-none h-[45px] last:pr-[15px]",
                      cell.column.id.toLowerCase() === "sender"
                        ? "text-left w-full"
                        : cell.column.id.toLowerCase() === "type"
                          ? "text-right"
                          : "text-left pr-[38px] w-[130px]",
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isLoadingMore && (
        <div className="flex justify-center items-center py-2">
          <Spinner className="w-4 h-4" />
          <span className="ml-2 text-sm text-foreground-300">
            Loading more...
          </span>
        </div>
      )}

      <div className="flex items-center justify-end gap-[3px] flex-shrink-0">
        <div className="flex items-center gap-[5px]">
          <Button
            variant="secondary"
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
            className="bg-background-200 hover:bg-[#2B2F2C] disabled:bg-background-100 border border-solid border-[#454B46] rounded-sm w-[28px] h-[21px] px-[6px] py-[7px] text-foreground-200 disabled:text-[#454B46]"
          >
            <ArrowToLineIcon
              variant="left"
              className="!w-[16px] !h-[16px] aspect-square"
            />
          </Button>
          <Button
            variant="secondary"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="bg-background-200 hover:bg-[#2B2F2C] disabled:bg-background-100 border border-solid border-[#454B46] rounded-sm w-[28px] h-[21px] px-[6px] py-[7px] text-foreground-200 disabled:text-[#454B46]"
          >
            <ArrowIcon
              variant="left"
              className="!w-[16px] !h-[16px] aspect-square"
            />
          </Button>
        </div>

        <div className="px-[8px] py-[2px] space-x-[4px] text-[12px]/[16px] text-foreground-400 ">
          <span className="font-normal">Page</span>
          <span className="tracking-[0.24px] font-semibold">
            {table.getState().pagination.pageIndex + 1}
          </span>
          <span className="font-normal">of</span>
          <span className="tracking-[0.24px] font-semibold">
            {table.getPageCount() || 1}
          </span>
        </div>

        <div className="flex items-center gap-[5px]">
          <Button
            variant="secondary"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="bg-background-200 hover:bg-[#2B2F2C] disabled:bg-background-100 border border-solid border-[#454B46] rounded-sm w-[28px] h-[21px] px-[6px] py-[7px] text-foreground-200 disabled:text-[#454B46]"
          >
            <ArrowIcon
              variant="right"
              className="!w-[16px] !h-[16px] aspect-square"
            />
          </Button>
          <Button
            variant="secondary"
            disabled={!table.getCanNextPage()}
            onClick={() => table.lastPage()}
            className="bg-background-200 hover:bg-[#2B2F2C] disabled:bg-background-100 border border-solid border-[#454B46] rounded-sm w-[28px] h-[21px] px-[6px] py-[7px] text-foreground-200 disabled:text-[#454B46]"
          >
            <ArrowToLineIcon
              variant="right"
              className="!w-[16px] !h-[16px] aspect-square"
            />
          </Button>
        </div>
      </div>
    </div>
  );
}
