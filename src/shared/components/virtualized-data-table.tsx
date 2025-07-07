import React, { useMemo, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { cn } from '@cartridge/ui';

interface VirtualizedDataTableProps {
  data: any[];
  columns: any[];
  className?: string;
  rowHeight?: number;
  headerHeight?: number;
}

export const VirtualizedDataTable = React.memo(({
  data,
  columns,
  className,
  rowHeight = 40,
  headerHeight = 40,
}: VirtualizedDataTableProps) => {
  const renderRow = useCallback((index: number) => {
    const row = data[index];
    if (!row) return null;

    return (
      <div
        className="flex border-b border-background-200 hover:bg-background-100 transition-colors"
        style={{ height: `${rowHeight}px` }}
      >
        {columns.map((column, colIndex) => (
          <div
            key={colIndex}
            className={cn(
              "flex items-center px-4 py-2 text-sm",
              column.className
            )}
            style={{ width: column.width || 'auto', minWidth: column.minWidth }}
          >
            {column.cell ? column.cell({ row, index }) : row[column.accessor]}
          </div>
        ))}
      </div>
    );
  }, [columns, data, rowHeight]);

  const renderHeader = useCallback(() => {
    return (
      <div
        className="flex border-b border-background-300 bg-background-50 font-medium text-background-700 sticky top-0 z-10"
        style={{ height: `${headerHeight}px` }}
      >
        {columns.map((column, colIndex) => (
          <div
            key={colIndex}
            className={cn(
              "flex items-center px-4 py-2 text-sm",
              column.className
            )}
            style={{ width: column.width || 'auto', minWidth: column.minWidth }}
          >
            {column.header ? column.header() : column.accessor}
          </div>
        ))}
      </div>
    );
  }, [columns, headerHeight]);

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {renderHeader()}
      <div className="flex-1">
        <Virtuoso
          data={data}
          itemContent={renderRow}
          style={{ height: '100%' }}
          overscan={5}
        />
      </div>
    </div>
  );
});

VirtualizedDataTable.displayName = 'VirtualizedDataTable'; 