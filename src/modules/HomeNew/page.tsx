import { SearchBar } from "@/shared/components/SearchBar";
import AccountDisplay from "@/shared/components/AccountDisplay";
import { useSpecVersion } from "@/shared/hooks/useSpecVersion";
import { Link } from "react-router-dom";
import { Network } from "@cartridge/ui";
import useChain from "@/shared/hooks/useChain";

export function Home() {
  const { id: chainId } = useChain();

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute top-0 right-0 h-[34px]">
        <AccountDisplay className="h-full" />
      </div>

      <div className="flex flex-col gap-2 p-1 w-[520px]">
        <div className="flex gap-2 w-full uppercase text-sm font-bold">
          <div className="h-[25px] px-3 py-1 flex-1 flex items-center bg-background-300">
            Explorer
          </div>

          {chainId && (
            <Network
              chainId={chainId.id}
              tooltipTriggerClassName="bg-background-300 hover:bg-background-200"
            />
          )}
        </div>

        <SearchBar />
      </div>

      <ChainInfoContainer />
    </div>
  );
}

function ChainInfoContainer() {
  const { data: specVersion } = useSpecVersion();

  return (
    <Link
      to="./json-rpc"
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
    <div className="homepage-chain-info-item border border-background-500 h-[20px] flex items-center">
      <span className="font-bold px-2">{label}</span>
      <span className="border-l border-background-500 px-2">{value}</span>
    </div>
  );
}
