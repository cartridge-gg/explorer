import { useQuery } from "@tanstack/react-query";
import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { shortString } from "starknet";
import { ChainId } from "@/types/types";

interface UseChainReturn {
  chainId: ChainId | undefined;
  isLoading: boolean;
  error: Error | null;
}

const useChain = (): UseChainReturn => {
  const fetchChainId = async (): Promise<ChainId> => {
    const chainId = await RPC_PROVIDER.getChainId();
    const decoded = decodeRawChainId(chainId as string);
    return decoded;
  };

  const {
    data: chainId,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["chainId"],
    queryFn: fetchChainId,
    retry: 3,
  });

  return { chainId, isLoading, error };
};

function decodeRawChainId(id: string): string {
  return shortString.decodeShortString(id);
}

export default useChain;
