import { useBlockNumber } from "@/shared/hooks/useBlockNumber";
import { cn } from "@cartridge/ui/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface BlockNavigationProps {
  currentBlockNumber: number;
}

export function BlockNavigation({ currentBlockNumber }: BlockNavigationProps) {
  const { blockNumber: latestBlockNumber } = useBlockNumber();
  const { hash } = useLocation();

  const isLatestBlock =
    latestBlockNumber !== undefined &&
    currentBlockNumber >= Number(latestBlockNumber);

  return (
    <div className="h-[20px] w-[105px] grid grid-cols-2 gap-[7px]">
      {currentBlockNumber > 0 && (
        <Link
          to={{
            pathname: `../block/${currentBlockNumber - 1}`,
            hash,
          }}
          className="flex-1 flex items-center justify-center bg-white border border-borderGray hover:bg-primary hover:border-primary hover:text-white cursor-pointer"
        >
          <ChevronLeft className="h-[13px]" />
        </Link>
      )}

      <Link
        to={{
          pathname: `../block/${currentBlockNumber + 1}`,
          hash,
        }}
        className={cn(
          "col-start-2 flex-1 flex items-center justify-center bg-white border border-borderGray hover:bg-primary hover:border-primary hover:text-white",
          isLatestBlock
            ? "bg-gray-100  text-gray-400 pointer-events-none"
            : "cursor-pointer",
        )}
      >
        <ChevronRight className="h-[13px]" />
      </Link>
    </div>
  );
}
