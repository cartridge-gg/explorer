import React, { useEffect } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { BlockWithTxHashes } from "starknet";

type Block = {
  number: string;
  status: string;
  hash: number;
  age: number;
};

const columnHelper = createColumnHelper<Block>();

const columns = [
  columnHelper.accessor("status", {
    header: () => "Status",
    cell: (info) => info.getValue(),
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("number", {
    header: () => "Number",
    cell: (info) => info.renderValue(),
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("hash", {
    header: () => "Hash",
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("age", {
    header: "Age",
    footer: (info) => info.column.id,
  }),
];

export default function BlocksTable(props: {
  blocks: (BlockWithTxHashes | undefined)[];
  isBlocksLoading: boolean;
}) {
  const { isBlocksLoading, blocks } = props;
  const [data, setData] = React.useState([]);

  useEffect(() => {}, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return <div className="bg-black"></div>;
}
