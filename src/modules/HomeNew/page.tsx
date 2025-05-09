import HomeSearchBar from "./SearchBar";
import ChainDisplay from "@/shared/components/ChainDisplay";
import AccountDisplay from "@/shared/components/AccountDisplay";
import { useSpecVersion } from "@/shared/hooks/useSpecVersion";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

// const POLLING_INTERVAL = 3000; // 3 seconds

export default function Home() {
  // // Fetch the latest block number
  // const { data: latestBlockNumber } = useQuery({
  //   queryKey: QUERY_KEYS.getBlockNumber,
  //   queryFn: () => RPC_PROVIDER.getBlockNumber(),
  //   refetchInterval: POLLING_INTERVAL,
  // });

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute top-0 right-0 h-[34px]">
        <AccountDisplay className="h-full" />
      </div>

      <div className="flex flex-col gap-2 p-1 bg-white w-[520px]">
        <div className="flex gap-2 w-full uppercase text-sm font-bold">
          <div className="h-[25px] px-3 py-1 bg-primary flex-1 text-white flex items-center">
            Explorer
          </div>

          <ChainDisplay />
        </div>

        <HomeSearchBar />
      </div>

      <ChainInfoContainer />
    </div>
  );
}

function ChainInfoContainer() {
  const { data: specVersion } = useSpecVersion();

  return (
    <Link
      to={ROUTES.JSON_RPC.urlPath}
      className="absolute bottom-0 left-0 flex flex-col uppercase text-sm items-start gap-1"
    >
      <ChainInfoItem
        label="Starknet JSON-RPC Spec"
        value={specVersion || "N/A"}
      />
    </Link>
  );
}

function ChainInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="homepage-chain-info-item border border-borderGray h-[20px] bg-white flex items-center">
      <span className="font-bold px-2">{label}</span>
      <span className="border-l border-l-borderGray px-2">{value}</span>
    </div>
  );
}
