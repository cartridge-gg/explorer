import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

export default function BlockDetails() {
  const { blockNumber } = useParams<{ blockNumber: string }>();

  // Block Details Page
  const { data: BlockReceipt, isLoading } = useQuery({
    queryKey: [""],
    queryFn: () => RPC_PROVIDER.getBlock(BigInt(blockNumber ?? 0)),
    enabled: !!blockNumber,
  });

  return (
    <div>
      BlockDetails Page
      {isLoading ? (
        <p className="text-white">Loading...</p>
      ) : (
        <>
          <p className=" text-white">Block Hash: {BlockReceipt?.block_hash}</p>
          <p className=" text-white">Block Status: {BlockReceipt?.status}</p>
          <p className=" text-white">
            Block Transaction Count: {BlockReceipt?.transactions?.length}
          </p>
        </>
      )}
    </div>
  );
}
