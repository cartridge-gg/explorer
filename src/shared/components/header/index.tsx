import { Account } from "./account";
import { useLocation } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  SearchIcon,
  Separator,
  Skeleton,
} from "@cartridge/ui";
import useChain from "@/shared/hooks/useChain";
import { Network } from "@/shared/components/network";
import { SearchBar } from "@/shared/components/search-bar";
import { useScreen } from "@/shared/hooks/useScreen";
import { useState } from "react";

export function Header() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { isMobile } = useScreen();
  const { id: chainId } = useChain();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="w-full flex items-center justify-between gap-2 mb-[20px] sticky top-[20px] lg:relative">
      <div className="w-[467px]">
        {!isHome &&
          (!isMobile ? (
            <SearchBar />
          ) : (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger>
                <div className="flex items-center w-10 h-10 bg-background-100 rounded-[4px] justify-center cursor-pointer hover:bg-background-300 transition-all">
                  <SearchIcon />
                </div>
              </DialogTrigger>
              <DialogContent
                aria-describedby="search bar"
                className="border-none h-full w-full flex flex-col items-center justify-start pt-[75px] bg-[#000000]/[0.7] backdrop-blur-[3px] gap-8 [&>button]:hidden"
                onClick={(e) => {
                  // Close dialog when clicking on the backdrop (not on the search bar)
                  if (e.target === e.currentTarget) {
                    setIsDialogOpen(false);
                  }
                }}
              >
                <SearchBar onNavigate={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          ))}
      </div>

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
