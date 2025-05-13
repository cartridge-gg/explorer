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
import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { getPaginatedBlockNumbers } from "@/shared/utils/rpc_utils";
import { truncateString } from "@/shared/utils/string";
import { useScreen } from "@/shared/hooks/useScreen";

const ROWS_TO_RENDER = 20;
const BLOCKS_BATCH_SIZE = 5; // Number of blocks to fetch at once

const columnHelper = createColumnHelper();

export function TransactionList() {
  const navigate = useNavigate();
  const { isMobile } = useScreen();
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

  const columns = [
    columnHelper.accessor("type", {
      header: "Type",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("hash", {
      header: "Transaction Hash",
      cell: (info) => (
        <div className="">
          {isMobile ? truncateString(info.renderValue()) : info.renderValue()}
        </div>
      ),
    }),
    columnHelper.accessor("age", {
      header: "Age",
      cell: (info) => {
        return dayjs.unix(info.getValue()).fromNow();
      },
    }),
  ];

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className=" text-white px-2 py-4 rounded-lg">
      <div className="flex flex-row justify-between items-center uppercase bg-[#4A4A4A] px-4 py-2">
        <h1 className="text-white">Transactions List</h1>
      </div>
      <div className="overflow-x-auto md:w-full">
        <table className="w-full mt-2 table-auto border-collapse border-t border-b border-[#8E8E8E] border-l-4 border-r">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-2 text-black font-bold text-left text-sm"
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
              <tr key={row.id} className="  text-black">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    onClick={() => navigate(`../tx/${cell.row.original.hash}`)}
                    className="p-2 text-sm"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-4 gap-4">
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
