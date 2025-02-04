import { useEffect, useState } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ROUTES } from "@/constants/routes";
import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { getPaginatedBlockNumbers } from "@/shared/utils/rpc_utils";

const ROWS_TO_RENDER = 10;
const BLOCKS_BATCH_SIZE = 5; // Number of blocks to fetch at once

const columnHelper = createColumnHelper();

const columns = [
  columnHelper.accessor("type", {
    header: "Type",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("hash", {
    header: "Transaction Hash",
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

const TransactionsTable = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [lastProcessedBlockIndex, setLastProcessedBlockIndex] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  const { data: latestBlockNumber } = useQuery({
    queryKey: ["latestBlockNumber"],
    queryFn: () => RPC_PROVIDER.getBlockNumber(),
  });

  const fetchBlocks = useMutation({
    mutationFn: async (blockNumbers: number[]) => {
      try {
        setIsFetching(true);
        const blockDataPromises = blockNumbers.map((blockNumber) =>
          RPC_PROVIDER.getBlockWithTxs(blockNumber)
        );
        return Promise.all(blockDataPromises);
      } catch (error) {
        console.error("Error fetching blocks:", error);
        return [];
      } finally {
        setIsFetching(false);
      }
    },
  });

  useEffect(() => {
    if (!latestBlockNumber) return;

    const startBlockNumber =
      latestBlockNumber - currentPage * BLOCKS_BATCH_SIZE;
    const blockNumbers = getPaginatedBlockNumbers(
      startBlockNumber,
      BLOCKS_BATCH_SIZE
    );

    fetchBlocks.mutate(blockNumbers, {
      onSuccess: (blocks) => {
        const newTransactions = [];
        let processedBlocks = 0;

        // Start from where we left off in the previous batch
        for (let i = lastProcessedBlockIndex; i < blocks.length; i++) {
          const block = blocks[i];
          if (!block || !block.transactions) continue;

          for (const tx of block.transactions) {
            newTransactions.push({
              type: tx.type,
              hash: tx.transaction_hash,
              age: block.timestamp.toString(),
            });

            // If we have enough transactions for the current page
            if (newTransactions.length >= ROWS_TO_RENDER) {
              setLastProcessedBlockIndex(i);
              setTransactions(newTransactions.slice(0, ROWS_TO_RENDER));
              return;
            }
          }
          processedBlocks++;
        }

        // If we've processed all blocks but still need more transactions
        if (
          processedBlocks === blocks.length &&
          newTransactions.length < ROWS_TO_RENDER
        ) {
          setLastProcessedBlockIndex(0); // Reset for next batch
          // You might want to fetch more blocks here
        }

        setTransactions(newTransactions);
      },
    });
  }, [latestBlockNumber, currentPage]);

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-black text-white p-4 rounded-lg">
      <div className="flex flex-row justify-between items-center">
        <h1>Transactions Table</h1>
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
                  key={cell.id}
                  onClick={() =>
                    navigate(
                      `${ROUTES.TRANSACTION_DETAILS.urlPath.replace(
                        ":transactionHash",
                        cell.row.original.hash
                      )}`
                    )
                  }
                  className="p-2 border border-gray-700"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between mt-4">
        <button
          disabled={currentPage === 0}
          onClick={() => {
            setCurrentPage((prev) => Math.max(prev - 1, 0));
            setLastProcessedBlockIndex(0); // Reset index when changing pages
          }}
          className="px-4 py-2 bg-gray-700 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => {
            setCurrentPage((prev) => prev + 1);
            setLastProcessedBlockIndex(0); // Reset index when changing pages
          }}
          className="px-4 py-2 bg-gray-700 disabled:opacity-50"
        >
          {isFetching ? "Loading..." : "Next"}
        </button>
      </div>
    </div>
  );
};

export default TransactionsTable;
