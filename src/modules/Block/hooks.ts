import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { isValidAddress } from "@/shared/utils/contract";
import {
  initExecutions,
  parseExecutionResources,
  initBlockComputeData,
} from "@/shared/utils/rpc_utils";
import { isNumber } from "@/shared/utils/string";
import { EventTableData, TransactionTableData } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

interface BlockData {
  block?: Awaited<ReturnType<typeof RPC_PROVIDER.getBlockWithReceipts>>;
  txs: TransactionTableData[];
  events: EventTableData[];
  executions: {
    ecdsa: number;
    keccak: number;
    bitwise: number;
    pedersen: number;
    poseidon: number;
    range_check: number;
    segment_arena: number;
  };
  blockComputeData: {
    gas: number;
    steps: number;
    data_gas: number;
  };
}

const initialData: BlockData = {
  txs: [],
  events: [],
  executions: initExecutions,
  blockComputeData: initBlockComputeData,
};

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
          executions: initialData.executions,
          blockComputeData: initialData.blockComputeData,
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

  return {
    data: {
      blockId,
      ...data,
    },
    isLoading,
    error,
  };
}
