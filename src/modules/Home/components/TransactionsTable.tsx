import React, { useCallback, useEffect } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { BlockWithTxHashes } from "starknet";
import { truncateString } from "@/utils/string";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

const INITIAL_TRANSACTIONS_TO_DISPLAY = 10;

type Transaction = {
  type: string;
  hash: string;
  age: number;
};

const columnHelper = createColumnHelper<Transaction>();

const columns = [
  columnHelper.accessor("hash", {
    header: () => "Hash",
    cell: (info) => truncateString(info.getValue()),
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("type", {
    header: () => "Type",
    cell: (info) => info.renderValue(),
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("age", {
    header: "Age",
    cell: (info) => {
      const date = Number(info.getValue());
      return date;
    },
  }),
];

export default function TransactionTable(props: {
  blocks: (BlockWithTxHashes | undefined)[];
  isBlocksLoading: boolean;
}) {
  const { isBlocksLoading, blocks } = props;
  const navigate = useNavigate();
  const [data, setData] = React.useState<Transaction[]>([]);

  const handleNavigate = useCallback(() => {
    navigate(ROUTES.TRANSACTION_LIST.urlPath);
  }, [navigate]);

  // filter out top 10 transactions from the latest blocks
  useEffect(() => {
    if (isBlocksLoading || !blocks) return;

    const transactions: Transaction[] = [];

    for (let i = 0; i < blocks.length; i++) {
      //check if block data is not undefined
      if (!blocks[i]) continue;
      const blockTransactions = blocks[i]?.transactions;

      // check if transactions exist inside block
      if (!blockTransactions) continue;
      for (const transaction of blockTransactions) {
        transactions.push({
          type: transaction.type,
          hash: transaction.transaction_hash,
          age: blocks[i].timestamp,
        });
      }

      // check if we have enough transactions
      if (transactions?.length >= INITIAL_TRANSACTIONS_TO_DISPLAY) {
        break;
      }
    }

    setData(transactions.slice(0, INITIAL_TRANSACTIONS_TO_DISPLAY));
  }, [blocks, isBlocksLoading]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isBlocksLoading) {
    return <div className="text-white p-4">Loading Transactions...</div>;
  }

  if (data?.length === 0) {
    return <div className="text-white p-4">No Transactions found</div>;
  }

  return (
    <div className="bg-black text-white p-4 rounded-lg">
      <div className="flex flex-row justify-between items-center">
        <h1>Transaction Table</h1>
        <h1 onClick={handleNavigate}>Show all transactions</h1>
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
                      `${ROUTES.TRANSACTION_DETAILS.urlPath.replace(
                        ":txHash",
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
}
