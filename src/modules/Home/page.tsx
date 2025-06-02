import { SearchBar } from "@/shared/components/SearchBar";
import { Header } from "@/shared/components/header";
import { useSpecVersion } from "@/shared/hooks/useSpecVersion";
import { Link } from "react-router-dom";
import { Network, Skeleton } from "@cartridge/ui";
import useChain from "@/shared/hooks/useChain";

export function Home() {
  const { id: chainId } = useChain();
  const { data: specVersion } = useSpecVersion();

  return (
    <div className="relative w-full h-full flex flex-col items-center">
      <Header />

      <div className="h-full flex flex-col items-center justify-center gap-2 p-1 w-full sm:w-[520px]">
        <div className="flex gap-2 w-full uppercase text-sm font-bold">
          <div className="px-3 py-1 flex flex-1 items-center bg-background-200 rounded-tl">
            Explorer
          </div>

          {chainId ? (
            <Network
              chainId={chainId.id}
              tooltipTriggerClassName="w-40 bg-background-200 hover:bg-background-300 rounded-none rounded-tr"
            />
          ) : (
            <Skeleton className="w-40 h-10 rounded-none rounded-tr" />
          )}
        </div>

        <SearchBar className="rounded-t-none" />
      </div>

      <Link
        to="./json-rpc"
        className="absolute bottom-0 left-0 flex flex-col uppercase text-sm items-start gap-1"
      >
        <div className="homepage-chain-info-item border border-background-200 h-[20px] flex items-center">
          <span className="font-bold px-2">Starknet JSON-RPC Spec</span>
          <span className="border-l border-background-200 px-2">
            {specVersion || "N/A"}
          </span>
        </div>
      </Link>
    </div>
  );
}
