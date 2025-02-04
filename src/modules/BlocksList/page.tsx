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
import { QUERY_KEYS, RPC_PROVIDER } from "@/services/starknet_provider_config";
import { getPaginatedBlockNumbers } from "@/shared/utils/rpc_utils";

const ROWS_TO_RENDER = 10;

const columnHelper = createColumnHelper();

const columns = [
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => (
      <span
        className={
          info.getValue() === "ACCEPTED_ON_L2"
            ? "text-green-500"
            : info.getValue() === "PENDING"
            ? "text-yellow-500"
            : "text-red-500"
        }
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

const BlocksList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  const { data: latestBlockNumber } = useQuery({
    queryKey: [QUERY_KEYS.getBlockNumber],
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
    onSuccess: (blocks) => {
      const newBlocks = blocks.map((block) => ({
        number: block.block_number.toString(),
        status: block.status,
        hash: block.block_hash,
        age: block.timestamp.toString(),
      }));

      setData(newBlocks);
    },
  });

  useEffect(() => {
    if (!latestBlockNumber) return;

    const blockNumbers = getPaginatedBlockNumbers(
      latestBlockNumber - currentPage * ROWS_TO_RENDER,
      ROWS_TO_RENDER
    );

    fetchBlocks.mutate(blockNumbers);
  }, [latestBlockNumber, currentPage]);

  const table = useReactTable({
    data: data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-black text-white p-4 rounded-lg">
      <div className="flex flex-row justify-between items-center">
        <h1>Blocks Table</h1>
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
                      `${ROUTES.BLOCK_DETAILS.urlPath.replace(
                        ":blockNumber",
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
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
          className="px-4 py-2 bg-gray-700 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className="px-4 py-2 bg-gray-700 disabled:opacity-50"
        >
          {isFetching ? "Loading..." : "Next"}
        </button>
      </div>
    </div>
  );
};

export default BlocksList;
