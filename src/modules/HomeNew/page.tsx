// import { useQuery } from "@tanstack/react-query";
// import { QUERY_KEYS, RPC_PROVIDER } from "@/services/starknet_provider_config";
import HomeSearchBar from "./SearchBar";
import ChainDisplay from "@/shared/components/ChainDisplay";

// const POLLING_INTERVAL = 3000; // 3 seconds

export default function Home() {
  // // Fetch the latest block number
  // const { data: latestBlockNumber } = useQuery({
  //   queryKey: QUERY_KEYS.getBlockNumber,
  //   queryFn: () => RPC_PROVIDER.getBlockNumber(),
  //   refetchInterval: POLLING_INTERVAL,
  // });

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col gap-2 p-1 bg-white">
        <div className="flex gap-2 w-full h-[22px] uppercase text-sm font-bold ">
          <div className="bg-primary flex-1 h-full px-[10px] text-white flex items-center">
            Explorer
          </div>
          <ChainDisplay />
        </div>

        <HomeSearchBar />
      </div>
    </div>
  );
}
