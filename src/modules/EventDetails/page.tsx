import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { formatNumber } from "@/shared/utils/number";
import { truncateString } from "@/shared/utils/string";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import dayjs from "dayjs";
import { cairo, events } from "starknet";

export default function EventDetails() {
  const { txHash, eventIndex } = useParams<{
    txHash: string;
    eventIndex: string;
  }>();
  const { isMobile } = useScreen();

  const { data: TransactionReceipt } = useQuery({
    queryKey: ["txn_receipt"],
    queryFn: () => RPC_PROVIDER.getTransactionReceipt(txHash ?? "0"),
    enabled: !!txHash,
  });

  const { data: BlockDetails } = useQuery({
    queryKey: ["txn_block_details"],
    queryFn: () => RPC_PROVIDER.getBlock(TransactionReceipt?.block_number),
    enabled: !!TransactionReceipt?.block_number,
  });

  const event = TransactionReceipt?.events?.[Number(eventIndex)];

  return (
    <div className="flex flex-col w-full gap-8 px-2 py-4">
      <div className="flex flex-col w-full gap-4">
        <div>
          <h2>
            . / explrr / events /{" "}
            {isMobile && txHash ? truncateString(txHash) : txHash} /{" "}
            {eventIndex}
          </h2>
        </div>

        <div className="flex flex-row justify-between items-center uppercase bg-[#4A4A4A] px-4 py-2">
          <h1 className="text-white">Event Details</h1>
        </div>

        <div className="flex flex-col w-full lg:flex-row gap-4 pb-4">
          <div className="flex flex-col gap-4">
            <div
              style={{
                borderBottomStyle: "dashed",
                borderBottomWidth: "2px",
              }}
              className="flex flex-col gap-4 p-4 border-[#8E8E8E] border-l-4 border-t border-r"
            >
              <div className="flex flex-col text-sm gap-2">
                <p className="w-fit font-bold px-2 py-1 bg-[#D9D9D9] text-black">
                  Transaction Hash
                </p>
                <p>{isMobile && txHash ? truncateString(txHash) : txHash}</p>
              </div>
              <div className="flex flex-col text-sm gap-1">
                <p className="w-fit font-bold px-2 py-1 bg-[#D9D9D9] text-black">
                  From Address
                </p>
                <p>
                  {isMobile && event?.from_address
                    ? truncateString(event.from_address)
                    : event?.from_address}
                </p>
              </div>
              <div className="flex flex-col text-sm gap-1">
                <p className="w-fit font-bold px-2 py-1 bg-[#D9D9D9] text-black">
                  Block Number
                </p>
                <p>{TransactionReceipt?.block_number}</p>
              </div>
              <div className="flex flex-col text-sm gap-1">
                <p className="w-fit font-bold px-2 py-1 bg-[#D9D9D9] text-black">
                  Timestamp
                </p>
                <p>
                  {BlockDetails?.timestamp} ({" "}
                  {dayjs
                    .unix(BlockDetails?.timestamp)
                    .format("MMM D YYYY HH:mm:ss")}{" "}
                  )
                </p>
              </div>
            </div>

            <div
              style={{
                borderTopStyle: "dashed",
                borderTopWidth: "2px",
              }}
              className="flex flex-col gap-4 p-4 border-[#8E8E8E] border-l-4 border-b border-r"
            >
              <div className="flex flex-col text-sm gap-1">
                <p className="w-fit font-bold px-2 py-1 bg-[#D9D9D9] text-black">
                  Keys
                </p>
                <div className="flex flex-col gap-2">
                  {event?.keys.map((key, index) => (
                    <p key={index}>{key}</p>
                  ))}
                </div>
              </div>
              <div className="flex flex-col text-sm gap-1">
                <p className="w-fit font-bold px-2 py-1 bg-[#D9D9D9] text-black">
                  Data
                </p>
                <div className="flex flex-col gap-2">
                  {event?.data.map((data, index) => (
                    <p key={index}>{data}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
