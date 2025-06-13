import { RPC_PROVIDER } from "@/services/rpc";
import { fetchDataCreator } from "@cartridge/utils";
import {
  AddressByUsernameDocument,
  AddressByUsernameQuery,
  AddressByUsernameQueryVariables,
} from "@cartridge/utils/api/cartridge";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { isBigInt } from "@/shared/utils/bigint";

export type SearchResultType = "tx" | "block" | "contract" | "class";

export interface SearchResult {
  type: SearchResultType;
  value: string;
  onSelect: () => void;
}

export function useSearch(searchValue: string) {
  const navigate = useNavigate();
  const { data: result, isLoading: isSearching } = useQuery({
    queryKey: ["search", searchValue],
    queryFn: async (): Promise<SearchResult | null> => {
      if (!searchValue.trim()) return null;

      if (isBigInt(searchValue)) {
        // For numeric/hex inputs, check multiple RPC methods
        const results = await Promise.allSettled([
          RPC_PROVIDER.getBlockWithTxs(searchValue),
          RPC_PROVIDER.getTransaction(searchValue),
          RPC_PROVIDER.getClassHashAt(searchValue),
          RPC_PROVIDER.getClass(searchValue),
        ]);

        const [isBlock, isTx, isContract, isClass] = results.map(
          (result) => result.status === "fulfilled",
        );

        if (isBlock) {
          return {
            type: "block",
            value: searchValue,
            onSelect: () => {
              navigate(`/block/${searchValue}`);
            },
          };
        } else if (isTx) {
          return {
            type: "tx",
            value: searchValue,
            onSelect: () => {
              navigate(`/tx/${searchValue}`);
            },
          };
        } else if (isContract) {
          return {
            type: "contract",
            value: searchValue,
            onSelect: () => {
              navigate(`/contract/${searchValue}`);
            },
          };
        } else if (isClass) {
          return {
            type: "class",
            value: searchValue,
            onSelect: () => {
              navigate(`/class/${searchValue}`);
            },
          };
        }

        return null;
      }

      // For non-numeric inputs, check username/controller
      const fetchData = fetchDataCreator(
        `${import.meta.env.VITE_CARTRIDGE_API_URL ?? "https://api.cartridge.gg"}/query`,
      );

      try {
        const res = await fetchData<
          AddressByUsernameQuery,
          AddressByUsernameQueryVariables
        >(AddressByUsernameDocument, {
          username: searchValue,
        });

        const address = res.account?.controllers?.edges?.[0]?.node?.address;
        if (address) {
          return {
            type: "contract",
            value: address,
            onSelect: () => {
              navigate(`/contract/${address}`);
            },
          };
        }
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("account not found")
        ) {
          console.log(`Account not found: ${searchValue}`);
        } else {
          console.error("Error fetching account:", error);
        }
      }

      return null;
    },
    enabled: !!searchValue.trim(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    result,
    isSearching,
  };
}
