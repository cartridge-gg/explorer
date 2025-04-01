import useChain from "../hooks/useChain";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";

export default function ChainDisplay(
  props: React.HTMLAttributes<HTMLDivElement>
) {
  const { id: chainId, isLoading, error } = useChain();
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorSize, setIndicatorSize] = useState<number>(0);
  const [showCopiedOverlay, setShowCopiedOverlay] = useState<boolean>(false);

  useEffect(() => {
    if (containerRef.current) {
      const containerHeight = containerRef.current.clientHeight;
      const indicatorHeight = Math.min(containerHeight * 0.4, 9);
      const roundedHeight = Math.round(indicatorHeight);
      setIndicatorSize(roundedHeight);
    }
  }, [containerRef]);

  const truncatedName = useMemo(() => {
    if (!chainId) {
      return;
    }

    return chainId.asDisplay.length > 7
      ? `${chainId.asDisplay.substring(0, 6)}..`
      : chainId.asDisplay;
  }, [chainId]);

  const handleClick = useCallback(() => {
    if (chainId && chainId.id) {
      navigator.clipboard.writeText(chainId.id);
      setShowCopiedOverlay(true);
      setTimeout(() => {
        setShowCopiedOverlay(false);
      }, 2000);
    }
  }, [chainId]);

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      title={chainId?.id ? `Copy chain id` : ""}
      className="bg-white w-[105px] border border-borderGray uppercase font-bold flex px-3 py-1 gap-3 items-center justify-between cursor-pointer relative"
      {...props}
    >
      <div
        className={`${chainId?.color}`}
        style={{
          width: `${indicatorSize}px`,
          height: `${indicatorSize}px`,
        }}
      ></div>
      {isLoading ? (
        <div
          style={{
            height: `${indicatorSize}px`,
          }}
          className="w-5/12 bg-borderGray"
        ></div>
      ) : (
        <span>{error || !truncatedName ? "Unknown" : truncatedName}</span>
      )}

      <div
        className={`absolute inset-0 bg-primary bg-opacity-70 flex items-center justify-center text-white text-xs transition-opacity duration-100 ease-in-out ${
          showCopiedOverlay ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        Copied!
      </div>
    </div>
  );
}
