import { cn } from "@cartridge/ui";
import type { Chain } from "@starknet-react/chains";
import { useCallback, useMemo } from "react";
import { getChecksumAddress } from "starknet";
import { toast } from "sonner";
import React from "react";
import { useScreen } from "@/shared/hooks/useScreen";
import useChain from "../hooks/useChain";

const ChainColors: Record<Chain["network"], string> = {
  mainnet: "bg-[#FF4264]",
  sepolia: "bg-[#6DE27C]",
  slot: "bg-[#FBCB4A]",
  other: "bg-[#9C9C9C]",
};

export const Network = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { id } = useChain();
  const chain = id?.asDisplay;
  const { isMobile } = useScreen();

  const onCopy = useCallback(() => {
    if (!id) return;

    navigator.clipboard.writeText(getChecksumAddress(id.id));
    toast.success("Chain ID copied");
  }, [id]);

  const color = useMemo(() => {
    if (!chain) return;

    return ChainColors[chain.toLowerCase()] || ChainColors["other"];
  }, [chain]);

  if (!chain) return null;

  return (
    <button
      type="button"
      onClick={onCopy}
      className={cn(
        "p-[10px] w-[40px] sm:w-[112px] gap-0.5 rounded-sm bg-background-100 flex items-center justify-start group",
        isMobile ? "active:bg-background-150" : "hover:bg-background-150",
        className,
      )}
      ref={ref}
      {...props}
    >
      <span
        className={cn(
          "size-[8px] aspect-square rounded-full m-[6px] self-center group-active:invisible sm:group-active:visible",
          color,
        )}
      />
      <span className="hidden sm:block text-foreground-200 group-hover:text-foreground-100 overflow-hidden text-center overflow-ellipsis whitespace-nowrap text-[14px]/[20px] font-medium px-[4px] capitalize">
        {chain}
      </span>
    </button>
  );
});

Network.displayName = "Network";
