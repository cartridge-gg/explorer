import React, { useCallback, useEffect, useState } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
import { BlockWithTxHashes } from "starknet";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import relativeTime from "dayjs/plugin/relativeTime";
import LinkArrow from "@/shared/icons/LinkArrow";
import { Block } from "@/types/types";

dayjs.extend(relativeTime);

const columnHelper = createColumnHelper<Block>();

const columns: ColumnDef<Block, string>[] = [
  columnHelper.accessor("number", {
    header: "Block Number",
    cell: (info) => `#${info.renderValue()}`,
  }),
  columnHelper.accessor("hash", {
    header: "Block Hash",
    cell: (info) => <div className="">{info.renderValue()}</div>,
  }),
  columnHelper.accessor("age", {
    header: "Age",
    cell: (info) => {
      return dayjs.unix(Number(info.getValue()) * 1000).fromNow();
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
        hash: block.block_hash,
        age: block.timestamp,
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
    <div className="text-black rounded-lg w-full">
      <div className="flex flex-row justify-between items-center uppercase bg-[#4A4A4A] px-4 py-2">
        <h1 className="text-white">Blocks</h1>
        <div
          onClick={handleNavigate}
          className="flex flex-row items-center gap-2 cursor-pointer"
        >
          <h4 className="text-white">View all blocks</h4>
          <LinkArrow color={"#fff"} />
        </div>
      </div>
      <div className=" w-screen sm:w-full overflow-x-auto h-full flex">
        <table className="w-full mt-2 table-auto border-collapse border-t border-b border-[#8E8E8E] border-l-4 border-r">
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="text-sm"
                onClick={() =>
                  navigate(
                    `${ROUTES.BLOCK_DETAILS.urlPath.replace(
                      ":blockNumber",
                      row.original.number
                    )}`
                  )
                }
              >
                <td className="w-1 p-2 whitespace-nowrap cursor-pointer">
                  <div className="flex items-center overflow-hidden">
                    <span className="whitespace-nowrap font-bold hover:text-blue-400 transition-all">
                      # {row.original.number}
                    </span>
                  </div>
                </td>

                <td className="w-full p-2 cursor-pointer">
                  <div className="flex items-center overflow-hidden">
                    <span className="whitespace-nowrap hover:text-blue-400 transition-all">
                      {row.original.hash}
                    </span>
                    <span className="flex-grow border-dotted border-b border-gray-500 mx-2"></span>
                  </div>
                </td>

                <td className="w-1 whitespace-nowrap p-2">
                  <div className="flex items-center justify-end">
                    <span className="whitespace-nowrap text-right">
                      {dayjs.unix(row?.original?.age).fromNow()}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BlocksTable;
