import { QUERY_KEYS, RPC } from "@/services/rpc";
import { useQueries, useQuery } from "@tanstack/react-query";
import { getPaginatedBlockNumbers } from "@/utils/rpc_utils";
import BlocksTable from "./components/BlocksTable";
import TransactionTable from "./components/TransactionsTable";

const INITIAL_BLOCKS_TO_FETCH = 10;

export default function Home() {
  // Fetch the latest block number
  const { data: latestBlockNumber } = useQuery({
    queryKey: QUERY_KEYS.latestBlockNumber,
    queryFn: () => RPC.fetchLatestBlock(),
  });

  // Fetch the last 10 blocks (Dependent on latestBlockNumber) in parallel
  const { data: latestBlocks, pending: isLatestBlocksLoading } = useQueries({
    queries: (latestBlockNumber
      ? getPaginatedBlockNumbers(latestBlockNumber, INITIAL_BLOCKS_TO_FETCH)
      : []
    ).map((block) => ({
      queryKey: QUERY_KEYS.blockWithTxHashes,
      queryFn: () => RPC.fetchBlockWithTxHashes(block),
      enabled: !!block,
    })),
    combine: (results) => {
      return {
        data: results.map((result) => result.data),
        pending: results.some((result) => result.isPending),
      };
    },
  });

  return (
    <div>
      Home page
      <BlocksTable
        blocks={latestBlocks}
        isBlocksLoading={isLatestBlocksLoading}
      />
      <TransactionTable
        blocks={latestBlocks}
        isBlocksLoading={isLatestBlocksLoading}
      />
    </div>
  );
}
