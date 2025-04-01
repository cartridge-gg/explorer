import { useQuery } from "@tanstack/react-query";
import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { shortString } from "starknet";
import { ChainId } from "@/types/types";

// Tailwind compatible color classes
const CHAIN_COLOR = {
  starknet: "bg-starknet-primary",
  slot: "bg-yellow-400",
  other: "bg-primary",
};

/**
 * ChainIdData class encapsulates the chain ID and defers decoding until needed
 */
class ChainIdData {
  private rawId: string;
  private _decoded: ChainId | null = null;

  constructor(rawId: string) {
    this.rawId = rawId;
  }

  get id(): string {
    return this.rawId;
  }

  get asDisplay(): string {
    if (this._decoded === null) {
      this._decoded = shortString.decodeShortString(this.rawId) as ChainId;
    }

    // Convert Starknet chain IDs to user-friendly display names
    return this._decoded === "SN_MAIN"
      ? "Mainnet"
      : this._decoded === "SN_SEPOLIA"
      ? "Sepolia"
      : this._decoded === "SN_GOERLI"
      ? "Goerli"
      : this._decoded;
  }

  /**
   * Gets the color class for this chain ID
   */
  get color(): string {
    if (this.isStarknet) {
      return CHAIN_COLOR.starknet;
    }
    return CHAIN_COLOR.other;
  }

  /**
   * Checks if the chain ID is a Starknet chain
   */
  private get isStarknet(): boolean {
    const decoded =
      this._decoded || (shortString.decodeShortString(this.rawId) as ChainId);

    return (
      decoded === "SN_MAIN" ||
      decoded === "SN_SEPOLIA" ||
      decoded === "SN_GOERLI"
    );
  }
}

interface UseChainReturn {
  id: ChainIdData | undefined;
  isLoading: boolean;
  error: Error | null;
}

const useChain = (): UseChainReturn => {
  const fetchChainId = async (): Promise<ChainIdData> => {
    const chainId = await RPC_PROVIDER.getChainId();
    const raw = chainId as string;
    return new ChainIdData(raw);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["chainId"],
    queryFn: fetchChainId,
    retry: 3,
  });

  return {
    error,
    isLoading,
    id: data,
  };
};

export default useChain;
