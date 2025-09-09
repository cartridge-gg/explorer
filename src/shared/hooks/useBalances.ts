import { useQuery } from "@tanstack/react-query";
import { RPC_PROVIDER } from "@/services/rpc";
import { Contract, uint256 } from "starknet";

// Default addresses for fee tokens
const DEFAULT_ADDRESSES: FeeTokenAddresses = {
  eth: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
  strk: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
};

const ERC20_ABI = [
  {
    members: [
      {
        name: "low",
        offset: 0,
        type: "felt",
      },
      {
        name: "high",
        offset: 1,
        type: "felt",
      },
    ],
    name: "Uint256",
    size: 2,
    type: "struct",
  },
  {
    inputs: [
      {
        name: "account",
        type: "felt",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "balance",
        type: "Uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

type FeeTokenAddresses = {
  eth: string;
  strk: string;
};

interface UseBalancesReturn {
  balances: {
    eth: bigint | undefined;
    strk: bigint | undefined;
  };
  isEthLoading: boolean;
  isStrkLoading: boolean;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

export function useBalances(
  contractAddress: string,
  addresses: FeeTokenAddresses = DEFAULT_ADDRESSES,
): UseBalancesReturn {
  const {
    data: ethBalance,
    isLoading: isEthLoading,
    isError: isEthError,
    error: ethError,
    refetch: refetchEth,
  } = useQuery({
    queryKey: ["balance", "eth", contractAddress, addresses.eth],
    queryFn: async () => {
      const eth = new Contract({
        abi: ERC20_ABI,
        address: addresses.eth,
        providerOrAccount: RPC_PROVIDER,
      });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { balance } = await eth.call("balanceOf", [contractAddress]);

      return uint256.uint256ToBN(balance);
    },
  });

  const {
    data: strkBalance,
    isLoading: isStrkLoading,
    isError: isStrkError,
    error: strkError,
    refetch: refetchStrk,
  } = useQuery({
    queryKey: ["balance", "strk", contractAddress, addresses.strk],
    queryFn: async () => {
      const strkContract = new Contract({
        abi: ERC20_ABI,
        address: addresses.strk,
        providerOrAccount: RPC_PROVIDER,
      });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { balance } = await strkContract.call("balanceOf", [
        contractAddress,
      ]);

      return uint256.uint256ToBN(balance);
    },
  });

  const refetch = () => {
    refetchEth();
    refetchStrk();
  };

  return {
    balances: { eth: ethBalance, strk: strkBalance },
    isEthLoading,
    isStrkLoading,
    isLoading: isEthLoading || isStrkLoading,
    isError: isEthError || isStrkError,
    error: ethError || strkError,
    refetch,
  };
}
