import { RPC_PROVIDER } from "@/services/rpc";
import { Badge } from "@/shared/components/badge";
import { Hash } from "@/shared/components/hash";
import { useScreen } from "@/shared/hooks/useScreen";
import { isValidAddress } from "@/shared/utils/contract";
import {
  initExecutions,
  parseExecutionResources,
  initBlockComputeData,
} from "@/shared/utils/rpc";
import { isNumber } from "@/shared/utils/string";
import { EventTableData, TransactionTableData } from "@/types/types";
import { CircleCheckIcon, TimesCircleIcon } from "@cartridge/ui";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

interface BlockData {
  block?: Awaited<ReturnType<typeof RPC_PROVIDER.getBlockWithReceipts>>;
  txs: TransactionTableData[];
  events: EventTableData[];
  executions?: {
    ecdsa: number;
    keccak: number;
    bitwise: number;
    pedersen: number;
    poseidon: number;
    range_check: number;
    segment_arena: number;
  };
  blockComputeData?: {
    gas: number;
    steps: number;
    data_gas: number;
  };
}

const initialData: BlockData = {
  txs: [],
  events: [],
  executions: undefined,
  blockComputeData: undefined,
};

const txColumnHelper = createColumnHelper<TransactionTableData>();
const eventColumnHelper = createColumnHelper<EventTableData>();

export function useBlock() {
  const { blockId } = useParams<{ blockId: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["block", blockId],
    queryFn: async () => {
      if (!blockId || !isNumber(blockId) || !isValidAddress(blockId)) {
        throw new Error("Invalid block identifier");
      }

      const block = await RPC_PROVIDER.getBlockWithReceipts(blockId);
      const txs = block.transactions.map(({ transaction, receipt }, id) => ({
        id,
        type: transaction.type,
        hash: receipt.transaction_hash,
        status: receipt.execution_status,
      }));
      const events = block.transactions.flatMap(({ receipt }) =>
        receipt.events.map((e, id) => ({
          id,
          txn_hash: receipt.transaction_hash,
          from: e.from_address,
          // Add required field based on EventTableData interface
          age: "",
        })),
      );
      const { executions, blockComputeData } = block.transactions.reduce(
        (acc, { receipt }) => {
          const r = parseExecutionResources(receipt.execution_resources);
          acc.executions.ecdsa += r.executions.ecdsa;
          acc.executions.keccak += r.executions.keccak;
          acc.executions.bitwise += r.executions.bitwise;
          acc.executions.pedersen += r.executions.pedersen;
          acc.executions.poseidon += r.executions.poseidon;
          acc.executions.range_check += r.executions.range_check;
          acc.executions.segment_arena += r.executions.segment_arena;
          acc.blockComputeData.gas += r.blockComputeData.gas;
          acc.blockComputeData.data_gas += r.blockComputeData.data_gas;
          acc.blockComputeData.steps += r.blockComputeData.steps;
          return acc;
        },
        {
          executions: initExecutions,
          blockComputeData: initBlockComputeData,
        },
      );

      return {
        block,
        txs,
        events,
        executions,
        blockComputeData,
      };
    },
    initialData,
    retry: false,
  });

  const { isMobile } = useScreen();
  const [txPagination, setTxPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const hashColumn = useMemo(
    () =>
      txColumnHelper.accessor("hash", {
        header: "Hash",
        cell: (info) => <Hash value={info.renderValue()} />,
        filterFn: (row, columnId, filterValue) => {
          const rowValue: string = row.getValue(columnId);
          if (filterValue === undefined || filterValue === "All") return true;
          return rowValue.includes(filterValue.toUpperCase());
        },
      }),
    [],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txColumns = useMemo<ColumnDef<TransactionTableData, any>[]>(
    () =>
      isMobile
        ? [hashColumn]
        : [
            txColumnHelper.accessor("id", {
              header: "No",
              cell: (info) => info.renderValue(),
            }),
            hashColumn,
            txColumnHelper.accessor("type", {
              header: "Type",
              cell: (info) => (
                <Badge className="capitalize">
                  {info.renderValue().replace(/_/g, " ").toLowerCase()}
                </Badge>
              ),
              filterFn: (row, columnId, filterValue) => {
                const rowValue: string = row.getValue(columnId);
                if (filterValue === undefined || filterValue === "All")
                  return true;
                return rowValue.includes(filterValue.toUpperCase());
              },
            }),
            txColumnHelper.accessor("status", {
              header: "Status",
              cell: (info) => {
                return (
                  <div className="flex items-center gap-2">
                    {(function () {
                      switch (info.renderValue()) {
                        case "REVERTED":
                          return (
                            <TimesCircleIcon className="size-[10px] text-[#ED9733]" />
                          );
                        case "REJECTED":
                          return (
                            <TimesCircleIcon className="size-[10px] text-destructive" />
                          );
                        case "SUCCEEDED":
                          return (
                            <CircleCheckIcon className="size-[10px] text-constructive" />
                          );
                      }
                    })()}
                    <div className="capitalize">
                      {info.renderValue().toLowerCase()}
                    </div>
                  </div>
                );
              },
            }),
          ],
    [isMobile, hashColumn],
  );

  const txs = useReactTable({
    data: data.txs,
    columns: txColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setTxPagination,
    state: {
      pagination: txPagination,
    },
  });

  const [eventPagination, setEventPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventColumns = useMemo<ColumnDef<EventTableData, any>[]>(
    () => [
      eventColumnHelper.accessor("id", {
        header: "No",
        cell: (info) => info.renderValue(),
      }),
      eventColumnHelper.accessor("txn_hash", {
        header: "Transaction",
        cell: (info) => (
          <Hash value={info.renderValue()} to={`../tx/${info.renderValue()}`} />
        ),
      }),
      eventColumnHelper.accessor("from", {
        header: "From Address",
        cell: (info) => (
          <Hash
            value={info.renderValue()}
            to={`../contract/${info.renderValue()}`}
          />
        ),
      }),
    ],
    [],
  );

  const events = useReactTable({
    data: data.events,
    columns: eventColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setEventPagination,
    state: {
      pagination: eventPagination,
    },
  });

  return {
    data: {
      blockId,
      ...data,
      txs,
      events,
    },
    isLoading,
    error,
  };
}
