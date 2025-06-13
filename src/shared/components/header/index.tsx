import { SearchBar } from "@/shared/search-bar";
import { Account } from "./account";
import { useLocation } from "react-router-dom";
import { Button, DotsIcon, Separator, Skeleton } from "@cartridge/ui";
import useChain from "@/shared/hooks/useChain";
import { useScreen } from "@/shared/hooks/useScreen";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/components/sheet";
import { Network } from "../network";

export function Header() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { id: chainId } = useChain();
  const { isMobile } = useScreen();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full flex items-center justify-between gap-2">
      <div className="w-[467px]">
        {!isHome &&
          (!isMobile ? (
            <SearchBar />
          ) : (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="icon" size="icon">
                  <DotsIcon className="rotate-90" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SearchBar onNavigate={() => setIsOpen(false)} />{" "}
              </SheetContent>
            </Sheet>
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
