import { useQueries, useQuery } from "@tanstack/react-query";
import { getPaginatedBlockNumbers } from "@/utils/rpc_utils";
import BlocksTable from "./components/BlocksTable";
import TransactionTable from "./components/TransactionsTable";
import { QUERY_KEYS, RPC_PROVIDER } from "@/services/starknet_provider";

const POLLING_INTERVAL = import.meta.env.HOME_PAGE_DATA_POLLING_INTERVAL; // 3 seconds
const INITIAL_BLOCKS_TO_FETCH = 10;

export default function Home() {
  // Fetch the latest block number
  const { data: latestBlockNumber } = useQuery({
    queryKey: QUERY_KEYS.getBlockNumber,
    queryFn: () => RPC_PROVIDER.getBlockNumber(),
    refetchInterval: POLLING_INTERVAL,
  });

  // Fetch the last 10 blocks (Dependent on latestBlockNumber) in parallel
  const latestBlocksQueries = useQueries({
    queries: latestBlockNumber
      ? getPaginatedBlockNumbers(
          latestBlockNumber,
          INITIAL_BLOCKS_TO_FETCH
        ).map((blockNumber) => ({
          queryKey: [QUERY_KEYS.getBlockWithTxs, blockNumber],
          queryFn: () => RPC_PROVIDER.getBlockWithTxs(blockNumber),
          enabled: !!blockNumber,
          refetchInterval: POLLING_INTERVAL,
        }))
      : [],
  });

  // Extract blocks data & loading states
  const latestBlocks = latestBlocksQueries
    ?.map((query) => query.data)
    .filter(Boolean);
  const isBlocksLoading = latestBlocksQueries?.some((query) => query.isLoading);

  return (
    <div className="flex flex-col w-screen h-screen justify-center items-center">
      Home page
      <div className="flex flex-row w-screen h-screen justify-center items-center">
        <BlocksTable blocks={latestBlocks} isBlocksLoading={isBlocksLoading} />
        <TransactionTable
          blocks={latestBlocks}
          isBlocksLoading={isBlocksLoading}
        />
      </div>
    </div>
  );
}
