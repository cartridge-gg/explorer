import { useNetwork } from "@starknet-react/core";
import { cn } from "@cartridge/ui";
import { Chain } from "@starknet-react/chains";
import { useCallback } from "react";
import { addAddressPadding } from "starknet";
import { toast } from "sonner";
import React from "react";

const ChainColors: Record<Chain["network"], string> = {
  mainnet: "#FF4264",
  sepolia: "#6DE27C",
  slot: "#FBCB4A",
  localhost: "#9C9C9C",
};

export const Network = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { chain } = useNetwork();

  const onCopy = useCallback(() => {
    navigator.clipboard.writeText(addAddressPadding(chain.id));
    toast.success("Address copied");
  }, [chain.id]);

  return (
    <button
      type="button"
      onClick={onCopy}
      className={cn(
        "p-[10px] w-[40px] sm:w-[112px] gap-0.5 rounded-sm bg-background-100 hover:bg-background-150 flex items-center justify-start group",
        className,
      )}
      ref={ref}
      {...props}
    >
      <span
        className={cn(
          "size-[8px] aspect-square rounded-full m-[6px] self-center",
        )}
        style={{
          backgroundColor:
            ChainColors[chain.network.toLowerCase()] || "#9C9C9C",
        }}
      />
      <span className="hidden sm:block text-foreground-200 group-hover:text-foreground-100 overflow-hidden text-center overflow-ellipsis whitespace-nowrap text-sm font-medium px-[4px] capitalize font-sans tracking-normal">
        {chain.network}
      </span>
    </button>
  );
});

Network.displayName = "Network";
