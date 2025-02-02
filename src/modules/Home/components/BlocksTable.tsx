import React, { useCallback, useEffect, useState } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { BlockWithTxHashes } from "starknet";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

type Block = {
  number: string;
  status: string;
  hash: string;
  age: string;
};

const columnHelper = createColumnHelper<Block>();

const columns: ColumnDef<Block, string>[] = [
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => (
      <span
        className={`
        ${
          info.getValue() === "ACCEPTED_ON_L2"
            ? "text-green-500"
            : info.getValue() === "PENDING"
            ? "text-yellow-500"
            : "text-red-500"
        }
      `}
      >
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("number", {
    header: "Block Number",
    cell: (info) => info.renderValue(),
  }),
  columnHelper.accessor("hash", {
    header: "Block Hash",
    cell: (info) => (
      <div className="max-w-[200px] overflow-hidden text-ellipsis">
        {info.renderValue()}
      </div>
    ),
  }),
  columnHelper.accessor("age", {
    header: "Age",
    cell: (info) => {
      const date = dayjs(Number(info.getValue()) * 1000);
      return dayjs().diff(date, "minute") + " minutes ago";
    },
  }),
];

const BlocksTable: React.FC<{
  blocks: (BlockWithTxHashes | undefined)[];
  isBlocksLoading: boolean;
}> = ({ isBlocksLoading, blocks }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<Block[]>([]);

  const handleNavigate = useCallback(() => {
    navigate(ROUTES.BLOCKS_LIST.urlPath);
  }, [navigate]);

  useEffect(() => {
    if (isBlocksLoading || !blocks) return;

    const blocksData: Block[] = blocks
      .filter((block) => block !== undefined)
      .map((block) => ({
        number: block.block_number.toString(),
        status: block.status,
        hash: block.block_hash,
        age: block.timestamp.toString(),
      }));

    setData(blocksData);
  }, [blocks, isBlocksLoading]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isBlocksLoading) {
    return <div className="text-white p-4">Loading blocks...</div>;
  }

  if (data?.length === 0) {
    return <div className="text-white p-4">No blocks found</div>;
  }

  return (
    <div className="bg-black text-white p-4 rounded-lg">
      <div className="flex flex-row justify-between items-center">
        <h1>Blocks Table</h1>
        <h1 onClick={handleNavigate}>Show all blocks</h1>
      </div>
      <table className="w-full table-auto border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-black">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="p-2 text-left border border-gray-700"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-gray-700 hover:bg-gray-900"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  onClick={() =>
                    navigate(
                      `${ROUTES.BLOCK_DETAILS.urlPath.replace(
                        ":blockNumber",
                        cell.row.original.hash
                      )}`
                    )
                  }
                  key={cell.id}
                  className="p-2 border border-gray-700"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BlocksTable;
