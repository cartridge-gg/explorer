import { useQuery } from "@tanstack/react-query";
import { createContext, ReactNode } from "react";
import { RPC_PROVIDER, QUERY_KEYS } from "@/services/starknet_provider_config";

export type BlockNumberContextType = {
  blockNumber: number | undefined;
  isLoading: boolean;
  error: Error | null;
};

export const BlockNumberContext = createContext<
  BlockNumberContextType | undefined
>(undefined);

type BlockNumberProviderProps = {
  children: ReactNode;
  refetchInterval?: number;
};

export function BlockNumberProvider({
  children,
  refetchInterval = 10000,
}: BlockNumberProviderProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.getBlockNumber,
    queryFn: () => RPC_PROVIDER.getBlockNumber(),
    // This should ideally be equal or less the block time of the chain to prevent delay
    refetchInterval: refetchInterval,
  });

  return (
    <BlockNumberContext.Provider
      value={{
        blockNumber: data,
        isLoading,
        error,
      }}
    >
      {children}
    </BlockNumberContext.Provider>
  );
}
