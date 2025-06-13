import { RPC_PROVIDER } from "@/services/rpc";
import { useScreen } from "@/shared/hooks/useScreen";
import { truncateString } from "@/shared/utils/string";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchDataCreator } from "@cartridge/utils";
import {
  AddressByUsernameDocument,
  AddressByUsernameQuery,
  AddressByUsernameQueryVariables,
} from "@cartridge/utils/api/cartridge";
import { cn, Input, SearchIcon, Skeleton } from "@cartridge/ui";

export function SearchBar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const { isMobile } = useScreen();

  const [value, setValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // State to track visual focus on the result
  const [isResultFocused, setIsResultFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [result, setResult] = useState<
    { type: "tx" | "block" | "contract" | "class"; value: string } | undefined
  >();

  // on clicking outside of dropdown, close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setValue("");
        setIsSearching(false);
        setResult(undefined);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const onSearch = useCallback((value: string) => {
    // Check if input is a valid BigInt (hex or numeric)
    setIsSearching(true);
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
        setIsSearching(false);
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
          setIsSearching(false);
        }
      })();
    }
  }, []);

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

    // Reset the search state
    setResult(undefined);
    setIsDropdownOpen(false);
    setIsResultFocused(false);
    setValue("");

    onNavigate?.();
  }, [navigate, result, onNavigate]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && result) {
      if (isResultFocused) {
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
      className={cn(
        "bg-input min-w-[200px] w-full h-[42px] flex relative border border-background-200 items-center justify-between shadow rounded",
        isDropdownOpen && result ? "border-b-0" : undefined,
        className,
      )}
    >
      <Input
        value={value}
        ref={inputRef}
        containerClassName="w-full flex-1 pl-4"
        className="bg-input border-none focus-visible:bg-input caret-foreground search-input"
        placeholder="Search blocks, transactions, contracts"
        onChange={(e) => {
          setValue(e.target.value);
          onSearch(e.target.value);
        }}
        onFocus={() => {
          setIsDropdownOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />

      <div
        className="cursor-pointer flex items-center px-[15px] h-full"
        onClick={() => onSearch(value)}
      >
        <SearchIcon />
      </div>

      {isDropdownOpen ? (
        <div
          ref={dropdownRef}
          className="bg-background search-dropdown absolute bottom-0 left-[-1px] right-[-1px] translate-y-full"
        >
          <div
            // hack for doing custom spacing for the dashed line
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--background) 50%, var(--background-400) 0%)",
              backgroundPosition: "top",
              backgroundSize: "15px 1px",
              backgroundRepeat: "repeat-x",
            }}
            className="flex flex-col gap-2 px-[15px] py-[10px] border border-background-200 border-t-0 shadow-md"
          >
            {isSearching && value ? (
              <div className="flex px-2 py-2 items-center justify-center text-sm text-foreground-100">
                <Skeleton className="w-full h-[10px] rounded-full" />
              </div>
            ) : result ? (
              <div
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onClick={handleResultClick}
                className={cn(
                  "flex flex-row hover:bg-background-400 cursor-pointer items-center gap-2 justify-between w-full px-2 py-1 outline-none",
                  isResultFocused && "bg-background-400",
                )}
              >
                <span className="font-bold uppercase">{result.type}</span>

                <span>{truncateString(result.value, isMobile ? 10 : 25)}</span>
              </div>
            ) : value ? (
              <div className="flex px-2 py-2 items-center justify-center text-sm lowercase text-foreground-100">
                <div>No results found</div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
