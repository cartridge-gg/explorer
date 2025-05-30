import { SearchBar } from "@/shared/components/SearchBar";
import { Account } from "./account";
import { useLocation } from "react-router-dom";
import { Network, Separator } from "@cartridge/ui";
import useChain from "@/shared/hooks/useChain";

export function Header() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { id: chainId } = useChain();

  return (
    <div className="w-full flex items-center justify-between gap-2">
      <div className="w-[467px]">{!isHome && <SearchBar />}</div>

      <div className="flex items-center gap-4">
        {!isHome && chainId && (
          <>
            <Network
              chainId={chainId.id}
              tooltipTriggerClassName="bg-background-300 hover:bg-background-200 h-12 text-md"
            />

            <Separator
              orientation="vertical"
              className="bg-background-400 w-1 h-8"
            />
          </>
        )}

        <Account />
      </div>
    </div>
  );
}
