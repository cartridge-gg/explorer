import React, { useEffect } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { BlockWithTxHashes, TransactionReceipt } from "starknet";

const INITIAL_TRANSACTIONS_TO_DISPLAY = 10;

type Transaction = {
  type: string;
  status: string;
  hash: number;
  age: number;
};

const columnHelper = createColumnHelper<Transaction>();

const columns = [
  columnHelper.accessor("status", {
    header: () => "Status",
    cell: (info) => info.getValue(),
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("hash", {
    header: () => "Hash",
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("type", {
    header: () => "Type",
    cell: (info) => info.renderValue(),
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("age", {
    header: "Age",
    footer: (info) => info.column.id,
  }),
];

export default function TransactionTable(props: {
  blocks: (BlockWithTxHashes | undefined)[];
  isBlocksLoading: boolean;
}) {
  const { isBlocksLoading, blocks } = props;
  const [data, setData] = React.useState<Transaction[]>([]);

  // filter out top 10 transactions from the latest blocks
  useEffect(() => {
    if (isBlocksLoading || !blocks) return;

    const transactions: TransactionReceipt[] = [];

    for (let i = 0; i < blocks.length; i++) {
      //check if block data is not undefined
      if (!blocks[i]) continue;
      const blockTransactions = blocks[i]?.transactions;

      // check if transactions exist inside block
      if (!blockTransactions) continue;
      //@ts-expect-error - we are sure that blockTransactions is not a string
      transactions.push(...blockTransactions);

      // check if we have enough transactions
      if (transactions.length >= INITIAL_TRANSACTIONS_TO_DISPLAY) {
        break;
      }
    }

    setData(transactions);
  }, [blocks, isBlocksLoading]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return <div className="bg-black"></div>;
}
