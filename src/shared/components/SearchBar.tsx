import { QUERY_KEYS, RPC_PROVIDER } from "@/services/starknet_provider_config";
import { useScreen } from "@/shared/hooks/useScreen";
import { truncateString } from "@/shared/utils/string";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchDataCreator } from "@cartridge/utils";
import {
  AddressByUsernameDocument,
  AddressByUsernameQuery,
  AddressByUsernameQueryVariables,
} from "@cartridge/utils/api/cartridge";
import { cn } from "@cartridge/ui/utils";
import { Input, SearchIcon } from "@cartridge/ui";

export function SearchBar({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { isMobile } = useScreen();

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownResultRef = useRef<HTMLDivElement>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // State to track visual focus on the result
  const [isResultFocused, setIsResultFocused] = useState(false);

  const [result, setResult] = useState<
    { type: "tx" | "block" | "contract" | "class"; value: string } | undefined
  >();

  const queryClient = useQueryClient();

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

  const performSearch = useCallback(
    (input: string) => {
      try {
        BigInt(input);
        const blockWithTxsPromise = queryClient
          .fetchQuery({
            queryKey: [QUERY_KEYS.getBlockWithTxs, input],
            queryFn: () => RPC_PROVIDER.getBlockWithTxs(input),
          })
          .then(() => true)
          .catch((error) => {
            console.error("Error fetching block with txs:", error);
            return false;
          });

        const transactionPromise = queryClient
          .fetchQuery({
            queryKey: [QUERY_KEYS.getTransaction, input],
            queryFn: () => RPC_PROVIDER.getTransaction(input),
          })
          .then(() => true)
          .catch((error) => {
            console.error("Error fetching transaction:", error);
            return false;
          });

        const classHashPromise = queryClient
          .fetchQuery({
            queryKey: [QUERY_KEYS.getClassHashAt, input],
            queryFn: () => RPC_PROVIDER.getClassHashAt(input),
          })
          .then(() => true)
          .catch((error) => {
            console.error("Error fetching class hash:", error);
            return false;
          });

        const classPromise = queryClient
          .fetchQuery({
            queryKey: [QUERY_KEYS.getClassAt, input],
            queryFn: () => RPC_PROVIDER.getClass(input),
          })
          .then(() => true)
          .catch((error) => {
            console.error("Error fetching class:", error);
            return false;
          });

        return Promise.all([
          blockWithTxsPromise,
          transactionPromise,
          classHashPromise,
          classPromise,
        ]);
      } catch {
        const controllerPromise = queryClient
          .fetchQuery({
            queryKey: [QUERY_KEYS.getController, input],
            queryFn: async () => {
              const fetchData = fetchDataCreator(
                `${import.meta.env.VITE_CARTRIDGE_API_URL ?? "https://api.cartridge.gg"}/query`,
              );
              try {
                const res = await fetchData<
                  AddressByUsernameQuery,
                  AddressByUsernameQueryVariables
                >(AddressByUsernameDocument, {
                  username: input,
                });
                return res.account?.controllers?.edges?.[0]?.node?.address;
              } catch (error) {
                console.error("Error fetching account:", error);
                return;
              }
            },
          })
          .catch((error) => {
            console.error("Error fetching account:", error);
            return false;
          });

        return Promise.all([controllerPromise]);
      }
    },
    [queryClient],
  );

  const handleSearch = useCallback(
    (value: string) => {
      if (!value || value.length === 0) return;
      // assuming that there will be no hash collision (very unlikely to collide)
      performSearch(value).then((promises) => {
        if (promises.length > 1) {
          const [isBlock, isTx, isContract, isClass] = promises;
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
        } else {
          const [address] = promises;
          if (address) {
            setResult({ type: "contract", value: address as string });
          } else {
            setResult(undefined);
          }
        }
      });
    },
    [performSearch],
  );

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
  }, [navigate, result]);

  const handleSearchIconClick = () => {
    if (inputRef.current?.value) {
      handleSearch(inputRef.current.value);
    }
  };

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
      className={cn(
        "min-w-[200px] w-full h-[42px] flex relative border border-background-500 items-center justify-between shadow rounded",
        isDropdownOpen && result ? "border-b-0" : undefined,
        className,
      )}
    >
      <Input
        ref={inputRef}
        containerClassName="w-full flex-1 pl-4"
        className="bg-background border-none focus-visible:bg-background caret-foreground"
        placeholder="Search blocks, transactions, contracts"
        onChange={(e) => {
          handleSearch(e.target.value);
          setIsDropdownOpen(!!e.target.value);
        }}
        onFocus={() => {
          if (result) setIsDropdownOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />

      <div
        className="cursor-pointer flex items-center px-[15px] h-full"
        onClick={handleSearchIconClick}
      >
        <SearchIcon />
      </div>

      {isDropdownOpen ? (
        <div className="bg-background search-dropdown absolute bottom-0 left-[-1px] right-[-1px] translate-y-full">
          <div
            // hack for doing custom spacing for the dashed line
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--background) 50%, var(--background-400) 0%)",
              backgroundPosition: "top",
              backgroundSize: "15px 1px",
              backgroundRepeat: "repeat-x",
            }}
            className="flex flex-col gap-2 px-[15px] py-[10px] border border-background-500 border-t-0 shadow-md"
          >
            {result ? (
              <div
                ref={dropdownResultRef}
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
            ) : (
              <div className="flex px-2 py-2 items-center justify-center text-sm lowercase text-foreground-100">
                <div>No results found</div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
