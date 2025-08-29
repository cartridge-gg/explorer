import { Account } from "./account";
import { useLocation } from "react-router-dom";
import {
  cn,
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

export function Header({ className }: { className?: string }) {
  const location = useLocation();
  const { isMobile } = useScreen();
  const { id: chainId } = useChain();
  const isHomePage = location.pathname === "/";

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <header
      className={cn(
        "fixed w-full flex items-center justify-center top-0 lg:relative transition-all duration-300 z-30",
        !isHomePage && "bg-gradient-to-b from-[#0C0E0C] to-transparent",
        className,
      )}
    >
      <div className="w-full sl:w-[1134px] flex items-center justify-between gap-2 ">
        <div className="w-[467px]">
          {!isHomePage &&
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
          {chainId ? (
            <Network />
          ) : (
            <Skeleton className="size-[40px] sm:w-[112px]" />
          )}
          <Separator
            orientation="vertical"
            className="bg-background-400 w-1 h-8"
          />
          <Account />
        </div>
      </div>
    </header>
  );
}
