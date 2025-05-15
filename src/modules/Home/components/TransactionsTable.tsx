import React, { useEffect } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { BlockWithTxHashes } from "starknet";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import LinkArrow from "@/shared/icons/LinkArrow";

const INITIAL_TRANSACTIONS_TO_DISPLAY = 10;

type Transaction = {
  hash_display: string;
  age: number;
  hash: string;
};

const columnHelper = createColumnHelper<Transaction>();

const columns = [
  columnHelper.accessor("hash_display", {
    header: () => "Hash",
    cell: (info) => info.getValue(),
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

export function TransactionTable(props: {
  blocks: (BlockWithTxHashes | undefined)[];
  isBlocksLoading: boolean;
}) {
  const { isBlocksLoading, blocks } = props;
  const navigate = useNavigate();
  const [data, setData] = React.useState<Transaction[]>([]);

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
          hash_display: `${transaction.transaction_hash} ( ${transaction.type} )`,
          age: blocks[i].timestamp,
          hash: transaction.transaction_hash,
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
    <div className=" text-black rounded-lg w-full">
      <div className="flex flex-row justify-between items-center uppercase bg-[#4A4A4A] px-4 py-2">
        <h1 className="text-white">Transactions</h1>
        <Link to="./txns" className="flex flex-row items-center gap-2">
          <h4 className="text-white">View all transactions</h4>
          <LinkArrow color={"#fff"} />
        </Link>
      </div>

      <div className=" w-screen sm:w-full overflow-x-auto h-full flex">
        <table className="w-full mt-2 table-auto border-collapse border-t border-b border-[#8E8E8E] border-l-4 border-r">
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="text-sm"
                onClick={() => navigate(`./tx/${row.original.hash}`)}
              >
                <td className="w-full p-2 cursor-pointer">
                  <div className="flex items-center overflow-hidden">
                    <span className="whitespace-nowrap hover:text-blue-400 transition-all">
                      {row.original.hash_display}
                    </span>
                    <span className="flex-grow border-dotted border-b border-gray-500 mx-2"></span>
                  </div>
                </td>

                <td className="w-1 whitespace-nowrap p-2 text-right">
                  <div className="flex items-center justify-end">
                    <span className="whitespace-nowrap">
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
}
