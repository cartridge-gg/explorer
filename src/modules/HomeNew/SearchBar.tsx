import { ROUTES } from "@/constants/routes";
import { QUERY_KEYS, RPC_PROVIDER } from "@/services/starknet_provider_config";
import { useScreen } from "@/shared/hooks/useScreen";
import SearchTool from "@/shared/icons/SearchTool";
import { truncateString } from "@/shared/utils/string";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function HomeSearchBar() {
  const navigate = useNavigate();
  const { isMobile } = useScreen();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  // on clicking outside of dropdown, close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.querySelector(".search-dropdown");
      const searchInput = document.querySelector(".search-input");

      if (
        isDropdownOpen &&
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
  }, [isDropdownOpen]);

  const [result, setResult] = useState<
    { type: "tx" | "block" | "contract" | "class"; value: string } | undefined
  >();

  const performSearch = useCallback(
    (input: string) => {
      try {
        BigInt(input);
      } catch (error) {
        console.error("Invalid input", error);
        return Promise.resolve([false, false, false, false]);
      }

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
    },
    [queryClient]
  );

  const handleSearch = (value: string) => {
    if (!value || value.length === 0) return;
    // assuming that there will be no hash collision (very unlikely to collide)
    performSearch(value).then(([isBlock, isTx, isContract, isClass]) => {
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
    });
  };

  const handleResultClick = useCallback(() => {
    if (result?.type === "tx") {
      navigate(
        ROUTES.TRANSACTION_DETAILS.urlPath.replace(":txHash", result.value)
      );
    } else if (result?.type === "block") {
      navigate(ROUTES.BLOCK_DETAILS.urlPath.replace(":blockId", result.value));
    } else if (result?.type === "contract") {
      navigate(
        ROUTES.CONTRACT_DETAILS.urlPath.replace(
          ":contractAddress",
          result.value
        )
      );
    } else if (result?.type === "class") {
      navigate(
        ROUTES.CLASS_HASH_DETAILS.urlPath.replace(":classHash", result.value)
      );
    }

    setIsDropdownOpen(false);
  }, [navigate, result]);

  const handleSearchIconClick = () => {
    if (inputRef.current?.value) {
      handleSearch(inputRef.current.value);
    }
  };

  return (
    <div
      className={`bg-white w-[520px] h-[42px] flex relative border border-borderGray items-center ${
        isDropdownOpen ? "border-b-0" : ""
      }`}
    >
      <input
        ref={inputRef}
        className="text-base search-input relative w-full h-full focus:outline-none focus:ring-0 py-2 pl-[15px]"
        placeholder="Search"
        onChange={(e) => handleSearch(e.target.value)}
      />

      <div
        className="cursor-pointer flex items-center px-[15px] h-full"
        onClick={handleSearchIconClick}
      >
        <SearchTool />
      </div>

      {result ? (
        <div className="search-dropdown absolute bottom-0 left-[-1px] right-[-1px] translate-y-full">
          <div
            // hack for doing custom spacing for the dashed line
            style={{
              backgroundImage:
                "linear-gradient(to right, white 50%, #D0D0D0 0%)",
              backgroundPosition: "top",
              backgroundSize: "15px 1px",
              backgroundRepeat: "repeat-x",
            }}
            className="flex flex-col gap-2 bg-white px-[15px] py-[10px] border border-borderGray border-t-0 shadow-md"
          >
            {result ? (
              <div
                onClick={handleResultClick}
                className="flex flex-row hover:bg-gray-100 cursor-pointer items-center gap-2 justify-between w-full px-2 py-1"
              >
                <span className="font-bold uppercase">{result.type}</span>

                <span>{truncateString(result.value, isMobile ? 10 : 25)}</span>
              </div>
            ) : (
              <div className="flex px-2 py-2 items-center justify-center text-sm lowercase">
                <div>No results found</div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
