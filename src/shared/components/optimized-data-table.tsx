import React, { useMemo } from 'react';
import { DataTable } from './data-table';
import { VirtualizedDataTable } from './virtualized-data-table';

interface OptimizedDataTableProps {
  table: any;
  virtualizationThreshold?: number;
  className?: string;
}

export const OptimizedDataTable = React.memo(({
  table,
  virtualizationThreshold = 100,
  className,
}: OptimizedDataTableProps) => {
  const shouldUseVirtualization = useMemo(() => {
    return table.getRowModel().rows.length > virtualizationThreshold;
  }, [table.getRowModel().rows.length, virtualizationThreshold]);

  if (shouldUseVirtualization) {
    // Convert table data to format expected by VirtualizedDataTable
    const data = table.getRowModel().rows.map((row: any) => row.original);
    const columns = table.getAllColumns().map((column: any) => ({
      accessor: column.id,
      header: () => column.columnDef.header,
      cell: ({ row, index }: { row: any; index: number }) => {
        const cell = table.getRowModel().rows[index]?.getAllCells().find((c: any) => c.column.id === column.id);
        return cell ? cell.renderValue() : null;
      },
      width: column.getSize(),
      minWidth: column.columnDef.minSize,
      className: column.columnDef.className,
    }));

    return (
      <VirtualizedDataTable
        data={data}
        columns={columns}
        className={className}
      />
    );
  }

  return <DataTable table={table} />;
});

OptimizedDataTable.displayName = 'OptimizedDataTable'; 