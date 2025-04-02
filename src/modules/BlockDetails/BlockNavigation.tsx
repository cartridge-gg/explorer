import { ROUTES } from "@/constants/routes";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface BlockNavigationProps {
  currentBlockNumber: number;
}

export default function BlockNavigation({
  currentBlockNumber,
}: BlockNavigationProps) {
  const navigate = useNavigate();

  const goToBlock = useCallback(
    (blockNumber: number) => {
      navigate(
        ROUTES.BLOCK_DETAILS.urlPath.replace(":blockId", blockNumber.toString())
      );
    },
    [navigate]
  );

  return (
    <div className="h-[20px] w-[105px] grid grid-cols-2 gap-[7px]">
      {currentBlockNumber > 0 && (
        <div
          onClick={() => goToBlock(currentBlockNumber - 1)}
          className="flex-1 flex items-center justify-center bg-white border border-borderGray hover:bg-primary hover:border-primary hover:text-white cursor-pointer"
        >
          <ChevronLeft className="h-[13px]" />
        </div>
      )}

      <div
        onClick={() => goToBlock(currentBlockNumber + 1)}
        className="col-start-2 flex-1 flex items-center justify-center bg-white border border-borderGray hover:bg-primary hover:border-primary hover:text-white cursor-pointer"
      >
        <ChevronRight className="h-[13px]" />
      </div>
    </div>
  );
}
