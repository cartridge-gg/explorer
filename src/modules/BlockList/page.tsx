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
import { QUERY_KEYS, RPC_PROVIDER } from "@/services/starknet_provider_config";
import { getPaginatedBlockNumbers } from "@/shared/utils/rpc_utils";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/shared/components/breadcrumb";
import { PageHeader, PageHeaderTitle } from "@/shared/components/PageHeader";
import { StackDiamondIcon } from "@cartridge/ui";
import { DataTable } from "@/shared/components/data-table";
import { Card, CardContent } from "@/shared/components/card";
import { getFinalityStatus } from "@/shared/utils/receipt";
import { Hash } from "@/shared/components/hash";

const columnHelper = createColumnHelper();

export function BlockList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const { data: latestBlockNumber } = useQuery({
    queryKey: [QUERY_KEYS.getBlockNumber],
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
      latestBlockNumber - pagination.pageIndex * pagination.pageSize,
      pagination.pageSize,
    );

    fetchBlocks.mutate(blockNumbers);
  }, [
    latestBlockNumber,
    pagination.pageIndex,
    pagination.pageSize,
    fetchBlocks,
  ]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => getFinalityStatus(info.renderValue()),
      }),
      columnHelper.accessor("number", {
        header: "Block Number",
        cell: (info) => info.renderValue(),
      }),
      columnHelper.accessor("hash", {
        header: "Block Hash",
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
    data: data.slice(
      pagination.pageIndex * pagination.pageSize,
      (pagination.pageIndex + 1) * pagination.pageSize,
    ),
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
    <div className="flex flex-col gap-2">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="..">Explorer</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Blocks</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader>
        <PageHeaderTitle>
          <StackDiamondIcon variant="solid" />
          <div>Blocks List</div>
        </PageHeaderTitle>
      </PageHeader>

      <Card>
        <CardContent>
          <DataTable
            table={table}
            onRowClick={(row) => navigate(`../block/${row.hash}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
