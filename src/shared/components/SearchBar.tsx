import { RPC_PROVIDER } from "@/services/rpc";
import { useScreen } from "@/shared/hooks/useScreen";
import { truncateString } from "@/shared/utils/string";
import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchDataCreator } from "@cartridge/utils";
import {
  AddressByUsernameDocument,
  AddressByUsernameQuery,
  AddressByUsernameQueryVariables,
} from "@cartridge/utils/api/cartridge";
import { cn, CommandShortcut, Input, SearchIcon } from "@cartridge/ui";
import { isMac } from "@/constants/device";
import { useDebounce } from "../hooks/useDebounce.tsx";
import React from "react";

export const SearchBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onNavigate?: () => void;
  }
>(({ className, onNavigate, ...props }, ref) => {
  const navigate = useNavigate();
  const { isMobile } = useScreen();

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownResultRef = useRef<HTMLButtonElement>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  // State to track visual focus on the result
  const [isResultFocused, setIsResultFocused] = useState(false);

  const [result, setResult] = useState<
    { type: "tx" | "block" | "contract" | "class"; value: string } | undefined
  >();

  const [isLoading, setIsLoading] = useState(false);

  // Handle Cmd+K / Ctrl+K keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // on clicking outside of dropdown, close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.querySelector(".search-dropdown");
      const searchInput = document.querySelector(".search-input");

      if (
        dropdown &&
        !dropdown.contains(event.target as Node) &&
        !searchInput?.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = useDebounce((value: string) => {
    // Check if input is a valid BigInt (hex or numeric)
    setIsLoading(true);
    setResult(undefined);

    try {
      BigInt(value);
      // For numeric/hex inputs, check multiple RPC methods
      Promise.allSettled([
        RPC_PROVIDER.getBlockWithTxs(value),
        RPC_PROVIDER.getTransaction(value),
        RPC_PROVIDER.getClassHashAt(value),
        RPC_PROVIDER.getClass(value),
      ]).then((results) => {
        setIsLoading(false);
        const [isBlock, isTx, isContract, isClass] = results.map(
          (result) => result.status === "fulfilled",
        );

        if (isBlock) {
          setResult({ type: "block", value });
        } else if (isTx) {
          setResult({ type: "tx", value });
        } else if (isContract) {
          setResult({ type: "contract", value });
        } else if (isClass) {
          setResult({ type: "class", value });
        } else {
          setResult(undefined);
        }

        if (isBlock || isTx || isContract || isClass) {
          setIsResultFocused(true);
        }
      });
    } catch {
      // For non-numeric inputs, check username/controller
      (async () => {
        const fetchData = fetchDataCreator(
          `${import.meta.env.VITE_CARTRIDGE_API_URL ?? "https://api.cartridge.gg"}/query`,
        );
        try {
          const res = await fetchData<
            AddressByUsernameQuery,
            AddressByUsernameQueryVariables
          >(AddressByUsernameDocument, {
            username: value,
          });
          const address = res.account?.controllers?.edges?.[0]?.node?.address;
          if (address) {
            setResult({ type: "contract", value: address });
          } else {
            setResult(undefined);
          }
        } catch (error) {
          console.error("Error fetching account:", error);
          setResult(undefined);
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, 500);

  const handleResultClick = useCallback(() => {
    switch (result?.type) {
      case "tx":
        navigate(`./tx/${result.value}`);
        break;
      case "block":
        navigate(`./block/${result.value}`);
        break;
      case "contract":
        navigate(`./contract/${result.value}`);
        break;
      case "class":
        navigate(`./class/${result.value}`);
        break;
      default:
        break;
    }

    setIsDropdownOpen(false);
    onNavigate?.();
  }, [navigate, result, onNavigate]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && result) {
      if (isResultFocused || e.currentTarget === dropdownResultRef.current) {
        handleResultClick();
      }
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
      setIsResultFocused(false);
    } else if (e.key === "ArrowDown" && result && isDropdownOpen) {
      setIsResultFocused(true);
      e.preventDefault(); // Prevent scrolling
    } else if (
      e.key === "ArrowUp" &&
      result &&
      isDropdownOpen &&
      isResultFocused
    ) {
      setIsResultFocused(false);
      e.preventDefault(); // Prevent scrolling
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        "min-w-[280px] w-full h-[40px] py-[7px] md:py-[10px] px-[10px] md:px-[12px] flex gap-[8px] relative border border-background-200 items-center rounded-sm bg-background-100 md:bg-spacer-100  shadow-[0px_4px_8px_0px_rgba(0,0,0,0.25)] md:shadow-none",
        isDropdownOpen && "border-b-0 rounded-b-none",
        className,
      )}
      {...props}
    >
      {/* Search Icon */}
      <div onClick={() => inputRef.current?.focus()} className="cursor-text">
        <SearchIcon
          className={cn(
            "!w-[20px] !h-[20px]",
            isInputFocused ? "text-foreground-100" : "text-foreground-400",
          )}
        />
      </div>

      {/* Search Input */}
      <Input
        ref={inputRef}
        name="search"
        containerClassName="flex-1"
        className="bg-background-100 focus-visible:bg-background-100 md:bg-spacer-100 md:focus-visible:bg-spacer-100  border-none caret-foreground search-input h-auto text-[14px]/[20px] placeholder:text-[14px]/[20px] px-0 font-mono rounded-none focus-visible:bg-input"
        placeholder="Search"
        onChange={(e) => {
          console.log(e);
          setIsLoading(true);
          handleSearch(e.target.value);
          setIsDropdownOpen(!!e.target.value);
        }}
        onFocus={() => {
          setIsInputFocused(true);
          if (result) setIsDropdownOpen(true);
        }}
        onBlur={() => {
          setIsInputFocused(false);
        }}
        onKeyDown={handleKeyDown}
      />

      {/* Command Shortcut - Only show when input is not focused */}
      {!isInputFocused && !isMobile && (
        <CommandShortcut
          className="flex items-center justify-center select-none cursor-text bg-[#262A27] border border-[#27292C] rounded-[3px] px-[8px] text-foreground-100 text-[12px]/[16px] font-semibold tracking-[0.24px] h-[17px] w-[30.768px]"
          onClick={() => inputRef.current?.focus()}
        >
          {isMac ? "⌘K" : "Ctrl+K"}
        </CommandShortcut>
      )}

      {/* {isDropdownOpen ? ( */}
      <div
        className={cn(
          "bg-background-100 md:bg-spacer-100 search-dropdown absolute bottom-0 left-[-1px] right-[-1px] translate-y-full select-none rounded-b-sm",
          isResultFocused && "cursor-pointer",
          isDropdownOpen ? "block" : "hidden",
        )}
      >
        <div className="border-t border-dashed border-background-200">
          <div className="flex flex-col gap-2 p-[10px] border border-background-200 border-t-0 rounded-b-sm h-[55px]">
            {isLoading ? (
              <div className="h-[35px] flex items-center justify-center">
                <span className="text-[12px]/[16px] font-normal normal-case text-foreground-400">
                  Searching...
                </span>
              </div>
            ) : result ? (
              <button
                ref={dropdownResultRef}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onClick={handleResultClick}
                className={cn(
                  "flex flex-row hover:bg-background-200 cursor-pointer items-center justify-between w-full px-[8px] py-[9px] outline-none rounded-sm h-[35px]",
                  isResultFocused && "bg-background-200",
                )}
              >
                <div className="bg-background-200 rounded-[3px] py-[2px] px-[8px] flex items-center justify-center">
                  <span className="capitalize text-[#A8A8A8] text-[12px]/[16px] font-semibold tracking-[0.24px]">
                    {result.type}
                  </span>
                </div>

                <span className="text-[13px]/[16px] font-normal font-mono text-foreground-400">
                  {truncateString(result.value, isMobile ? 10 : 25)}
                </span>
              </button>
            ) : (
              <div className="h-[35px] flex items-center justify-center">
                <span className="text-[12px]/[16px] font-normal normal-case text-foreground-400">
                  No results found
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* ) : null} */}
    </div>
  );
});

SearchBar.displayName = "Searchbar";
