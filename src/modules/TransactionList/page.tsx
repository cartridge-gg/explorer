import { useEffect, useMemo, useState } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { RPC_PROVIDER } from "@/services/rpc";
import { getPaginatedBlockNumbers } from "@/shared/utils/rpc";
import { PageHeader, PageHeaderTitle } from "@/shared/components/PageHeader";
import { ListIcon, Card, CardContent } from "@cartridge/ui";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/shared/components/breadcrumb";
import { DataTable } from "@/shared/components/data-table";
import { Hash } from "@/shared/components/hash";

const ROWS_TO_RENDER = 20;
const BLOCKS_BATCH_SIZE = 5; // Number of blocks to fetch at once

const columnHelper = createColumnHelper();

export function TransactionList() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [lastProcessedBlockIndex, setLastProcessedBlockIndex] = useState(0);

  const { data: latestBlockNumber } = useQuery({
    queryKey: ["latestBlockNumber"],
    queryFn: () => RPC_PROVIDER.getBlockNumber(),
  });

  const fetchBlocks = useMutation({
    mutationFn: async (blockNumbers: number[]) => {
      try {
        const blockDataPromises = blockNumbers.map((blockNumber) =>
          RPC_PROVIDER.getBlockWithTxs(blockNumber),
        );
        return Promise.all(blockDataPromises);
      } catch (error) {
        console.error("Error fetching blocks:", error);
        return [];
      }
    },
  });

  useEffect(() => {
    if (!latestBlockNumber) return;

    const startBlockNumber =
      latestBlockNumber - pagination.pageIndex * BLOCKS_BATCH_SIZE;
    const blockNumbers = getPaginatedBlockNumbers(
      startBlockNumber,
      BLOCKS_BATCH_SIZE,
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
  }, [latestBlockNumber, pagination, fetchBlocks]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("type", {
        header: "Type",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("hash", {
        header: "Transaction Hash",
        cell: (info) => <Hash value={info.renderValue()} />,
      }),
      columnHelper.accessor("age", {
        header: "Age",
        cell: (info) => {
          return dayjs.unix(info.getValue()).fromNow();
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    initialState: {
      pagination,
    },
  });

  return (
    <div className="px-2 py-4 rounded-lg flex flex-col gap-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="..">Explorer</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-foreground-400 text-[12px]/[16px] font-normal">
              Transactions
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader>
        <PageHeaderTitle>
          <ListIcon variant="solid" />
          <div>Transactions List</div>
        </PageHeaderTitle>
      </PageHeader>

      <Card>
        <CardContent>
          <DataTable
            table={table}
            onRowClick={(row) => navigate(`../tx/${row.hash}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
