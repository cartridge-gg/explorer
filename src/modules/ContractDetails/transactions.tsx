import { TabsContent } from "@/shared/components/tab";
import { DataTable } from "@/shared/components/dataTable";
import { getPaginationRowModel, getCoreRowModel, createColumnHelper } from "@tanstack/react-table";
import { useReactTable } from "@tanstack/react-table";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { useParams } from "react-router-dom";
import { GetTransactionReceiptResponse } from "starknet";

type Transaction = {
  hash: string;
  receipt: GetTransactionReceiptResponse;
  details: ReturnType<typeof RPC_PROVIDER.getTransactionByHash>;
};

const columnHelper = createColumnHelper<Transaction>();

const columns = [
  columnHelper.accessor("receipt.status", {
    header: () => "Status",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("hash", {
    header: () => "Hash",
    cell: (info) => info.getValue(),
  }),
  // columnHelper.accessor("type", {
  //   header: () => "Type",
  //   cell: (info) => info.getValue(),
  // }),
  // columnHelper.accessor("operation", {
  //   header: () => "Operations",
  //   cell: (info) => info.getValue(),
  // }),
  // columnHelper.accessor("block", {
  //   header: () => "Block",
  //   cell: (info) => info.getValue(),
  // }),
  // columnHelper.accessor("timestamp", {
  //   header: () => "Timestamp",
  //   cell: (info) => info.getValue(),
  // }),
];

export function TransactionsTabsContent() {
  const { contractAddress } = useParams<{
    contractAddress: string;
  }>();

  const { data } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { events } = await RPC_PROVIDER.getEvents({
        address: contractAddress!,
        chunk_size: 1,
        from_block: { block_number: 0 },
        to_block: "latest",
      });

      const txHashes = [...new Set(events.map(event => event.transaction_hash))];

      return Promise.all(
        txHashes.map(async (hash) => {
          const [receipt, details] = await Promise.all([
            RPC_PROVIDER.getTransactionReceipt(hash),
            RPC_PROVIDER.getTransactionByHash(hash)
          ]);
          return {
            hash,
            receipt,
            details,
          };
        })
      );
    },
    enabled: !!contractAddress
  });

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination,
    },
  });

  return (
    <TabsContent value="transactions">
      <DataTable
        table={table}
        pagination={pagination}
        setPagination={setPagination}
      />
    </TabsContent>
  )
}
