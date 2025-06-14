// import { SearchBar } from "@/shared/search-bar";
import { Account } from "./account";
import { useLocation } from "react-router-dom";
import { Separator, Skeleton } from "@cartridge/ui";
import useChain from "@/shared/hooks/useChain";
import { Network } from "@/shared/components/network";
import { SearchBar } from "@/shared/components/search-bar";

export function Header() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { id: chainId } = useChain();

  return (
    <div className="w-full flex items-center justify-between gap-2 mb-[20px]">
      <div className="w-[467px]">{!isHome && <SearchBar />}</div>

      <div className="flex items-center gap-4">
        {!isHome && (
          <>
            {chainId ? (
              <Network />
            ) : (
              <Skeleton className="size-[40px] sm:w-[112px]" />
            )}
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
