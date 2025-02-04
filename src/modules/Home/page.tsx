import { useQueries, useQuery } from "@tanstack/react-query";
import { getPaginatedBlockNumbers } from "@/shared/utils/rpc_utils";
import BlocksTable from "./components/BlocksTable";
import TransactionTable from "./components/TransactionsTable";
import { QUERY_KEYS, RPC_PROVIDER } from "@/services/starknet_provider_config";
import SearchBar from "@/shared/components/search_bar";
import InfoBlock from "@/shared/components/infoblocks";

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
    <div className="flex flex-col w-full gap-8 px-2 py-4">
      <div className="w-fit border-l-4 border-[#4A4A4A] flex justify-center items-center">
        <h1 className=" px-2">explrr .</h1>
      </div>
      <div className="flex flex-col w-full gap-16">
        <div className="flex flex-row w-full gap-12">
          <div className="w-full">
            <SearchBar />
          </div>
          <div className="w-full flex flex-row gap-2 justify-end">
            <InfoBlock left="Blocks" right="1,202,512" />
            <InfoBlock left="Txs" right="1,202,512" />
            <InfoBlock left="Classes" right="1,202,512" />
            <InfoBlock left="Contracts" right="1,202,512" />
          </div>
        </div>
        <div className="flex flex-col w-full gap-8">
          <BlocksTable
            blocks={latestBlocks}
            isBlocksLoading={isBlocksLoading}
          />
          <TransactionTable
            blocks={latestBlocks}
            isBlocksLoading={isBlocksLoading}
          />
        </div>
      </div>
    </div>
  );
}
