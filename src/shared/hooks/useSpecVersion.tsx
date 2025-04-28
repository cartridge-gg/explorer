import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { useQuery } from "@tanstack/react-query";

export function useSpecVersion() {
  return useQuery({
    queryKey: ["specVersion"],
    queryFn: () => RPC_PROVIDER.getSpecVersion(),
  });
}
