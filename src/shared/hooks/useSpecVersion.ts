import { RPC_PROVIDER } from "@/services/rpc";
import { useQuery } from "@tanstack/react-query";

export function useSpecVersion() {
  return useQuery({
    queryKey: ["specVersion"],
    queryFn: () => RPC_PROVIDER.getSpecVersion(),
  });
}
