import { useQuery } from "@tanstack/react-query";
import { detectRpcCapabilities } from "@/services/rpc";

export function useRpcCapabilities() {
  return useQuery({
    queryKey: ["rpc-capabilities"],
    queryFn: detectRpcCapabilities,
    staleTime: 1000 * 60 * 5, // 5 minutes - capabilities don't change often
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1, // Only retry once on failure
  });
}

// Helper hook for specific capability checks
export function useHasKatanaExtensions() {
  const { data: capabilities, isLoading, error } = useRpcCapabilities();

  return {
    hasKatanaExtensions: capabilities?.hasKatanaExtensions ?? false,
    isLoading,
    error,
    supportedMethods: capabilities?.supportedMethods ?? [],
  };
}
