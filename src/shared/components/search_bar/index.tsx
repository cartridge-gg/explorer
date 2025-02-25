import { ROUTES } from "@/constants/routes";
import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { useScreen } from "@/shared/hooks/useScreen";
import { truncateString } from "@/shared/utils/string";
import { Input } from "@cartridge/ui-next";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBar() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { isMobile } = useScreen();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  const [resultType, setResultType] = useState<
    "transaction" | "block" | "contract" | "class" | "not found"
  >("not found");

  const checkForTransactionHash = async (value: string) => {
    try {
      // check in RPC
      const result = await RPC_PROVIDER.getTransactionByHash(value);

      if (result) {
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  };

  const checkForBlockHash = async (value: string) => {
    try {
      // check in RPC
      const result = await RPC_PROVIDER.getBlock(value);

      if (result) {
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  };

  const checkForContractAddress = async (value: string) => {
    try {
      // check in RPC
      const result = await RPC_PROVIDER.getClassHashAt(value);

      if (result) {
        return true;
      }
    } catch (_) {
      return false;
    }
  };

  const checkForClassHash = async (value: string) => {
    try {
      // check in RPC
      const result = await RPC_PROVIDER.getClassByHash(value);

      if (result) {
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value.length === 0) {
      setResultType("not found");
    }

    setSearch(value);

    if (value.length !== 65 && value.length !== 66) return;

    setIsDropdownOpen(true);

    // check if valid value
    Promise.all([
      checkForTransactionHash(value),
      checkForBlockHash(value),
      checkForContractAddress(value),
      checkForClassHash(value),
    ]).then(
      ([isTransactionHash, isBlockHash, isContractAddress, isClassHash]) => {
        if (isTransactionHash) {
          setResultType("transaction");
        } else if (isBlockHash) {
          setResultType("block");
        } else if (isContractAddress) {
          setResultType("contract");
        } else if (isClassHash) {
          setResultType("class");
        } else {
          setResultType("not found");
        }
      }
    );
  };

  const handleResultClick = () => {
    if (resultType === "transaction") {
      navigate(ROUTES.TRANSACTION_DETAILS.urlPath.replace(":txHash", search));
    } else if (resultType === "block") {
      navigate(ROUTES.BLOCK_DETAILS.urlPath.replace(":blockNumber", search));
    } else if (resultType === "contract") {
      navigate(
        ROUTES.CONTRACT_DETAILS.urlPath.replace(":contractAddress", search)
      );
    } else if (resultType === "class") {
      navigate(ROUTES.CLASS_HASH_DETAILS.urlPath.replace(":classHash", search));
    }

    setIsDropdownOpen(false);
  };

  return (
    <div className="flex flex-col gap-2 relative">
      <Input
        className="search-input relative border-l-4 border-[#8E8E8E] w-full lowercase px-2 focus:outline-none focus:ring-0"
        placeholder="search"
        value={search}
        onChange={handleSearch}
      />
      {/* dropdown with results */}
      {isDropdownOpen && search.length > 0 ? (
        <div className="search-dropdown absolute bottom-0 left-0 right-0 translate-y-full">
          <div className="flex flex-col gap-2 bg-white p-2 border border-[#8E8E8E]">
            {resultType !== "not found" ? (
              <div
                onClick={handleResultClick}
                className="flex flex-row hover:bg-gray-100 cursor-pointer px-2 py-2 items-center gap-2 justify-between w-full"
              >
                <div className="text-sm">
                  {truncateString(search, isMobile ? 10 : 20)}
                </div>

                <div className="text-sm font-medium uppercase px-2 py-1 border border-[#8E8E8E] bg-gray-100">
                  {resultType}
                </div>
              </div>
            ) : (
              <div className="flex flex-row px-2 py-2 items-center gap-2 justify-between w-full">
                <div className="text-sm">No results found</div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
