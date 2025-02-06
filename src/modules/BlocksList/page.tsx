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
import { useScreen } from "@/shared/hooks/useScreen";
import { truncateString } from "@/shared/utils/string";

const ROWS_TO_RENDER = 20;

const columnHelper = createColumnHelper();

const BlocksList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const { isMobile } = useScreen();

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

  const columns = [
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => <span>{info.getValue()}</span>,
    }),
    columnHelper.accessor("number", {
      header: "Block Number",
      cell: (info) => info.renderValue(),
    }),
    columnHelper.accessor("hash", {
      header: "Block Hash",
      cell: (info) => (
        <div className="overflow-hidden ">
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
    data: data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="text-white px-2 py-4 rounded-lg ">
      <div className="flex flex-row justify-between items-center uppercase bg-[#4A4A4A] px-4 py-2">
        <h1 className="text-white">Blocks List</h1>
      </div>
      <div className="overflow-x-auto md:w-full">
        <table className="w-full mt-2 table-auto border-collapse border-spacing-12 border-t border-b border-[#8E8E8E] border-l-4 border-r">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-2 text-sm text-left whitespace-nowrap text-black font-bold"
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
              <tr key={row.id} className="">
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
                    className="w-1 p-2 text-sm whitespace-nowrap text-black cursor-pointer"
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
