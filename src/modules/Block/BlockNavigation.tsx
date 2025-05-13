import { useBlockNumber } from "@/shared/hooks/useBlockNumber";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface BlockNavigationProps {
  currentBlockNumber: number;
}

export default function BlockNavigation({
  currentBlockNumber,
}: BlockNavigationProps) {
  const { blockNumber: latestBlockNumber } = useBlockNumber();

  const isLatestBlock =
    latestBlockNumber !== undefined &&
    currentBlockNumber >= Number(latestBlockNumber);

  return (
    <div className="h-[20px] w-[105px] grid grid-cols-2 gap-[7px]">
      {currentBlockNumber > 0 && (
        <Link
          to={`../block/${currentBlockNumber - 1}`}
          className="flex-1 flex items-center justify-center bg-white border border-borderGray hover:bg-primary hover:border-primary hover:text-white cursor-pointer"
        >
          <ChevronLeft className="h-[13px]" />
        </Link>
      )}

      {!isLatestBlock ? (
        <Link
          to={`../block/${currentBlockNumber + 1}`}
          className="col-start-2 flex-1 flex items-center justify-center bg-white border border-borderGray hover:bg-primary hover:border-primary hover:text-white cursor-pointer"
        >
          <ChevronRight className="h-[13px]" />
        </Link>
      ) : (
        <div className="col-start-2 flex-1 flex items-center justify-center bg-gray-100 border border-borderGray text-gray-400 cursor-not-allowed">
          <ChevronRight className="h-[13px]" />
        </div>
      )}
    </div>
  );
}
