import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

export default function TransactionDetails() {
  const { txHash } = useParams<{ txHash: string }>();

  const { data: TxnReceipt, isLoading } = useQuery({
    queryKey: [""],
    queryFn: () => RPC_PROVIDER.getTransactionReceipt(BigInt(txHash ?? 0)),
    enabled: !!txHash,
  });

  return (
    <div>
      TransactionDetails Page
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <p className=" text-white">Transaction Hash: {txHash}</p>
          <p className=" text-white">
            Transaction Fee: {TxnReceipt?.actual_fee?.amount}{" "}
            {TxnReceipt?.actual_fee?.unit}
          </p>
        </>
      )}
    </div>
  );
}
