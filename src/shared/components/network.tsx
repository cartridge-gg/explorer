import { useNetwork } from "@starknet-react/core";
import { cn } from "@cartridge/ui";
import { Chain } from "@starknet-react/chains";
import { useEffect } from "react";

const ChainColors: Record<Chain["network"], string> = {
  mainnet: "#FF4264",
  sepolia: "#6DE27C",
  slot: "#FBCB4A",
  localhost: "#9C9C9C",
};

export const Network = () => {
  const { chain } = useNetwork();

  useEffect(() => {
    console.log("chain: ", chain);
  }, [chain]);

  return (
    <button className="p-[10px] min-w-[112px] gap-0.5 rounded-sm bg-background-100 hover:bg-background-150 flex items-center justify-start group">
      <span
        className={cn(
          "size-[8px] aspect-square rounded-full m-[6px] self-center",
        )}
        style={{
          backgroundColor:
            ChainColors[chain.network.toLowerCase()] || "#9C9C9C",
        }}
      />
      <span className="text-foreground-200 group-hover:text-foreground-100 overflow-hidden text-center overflow-ellipsis whitespace-nowrap text-sm font-medium px-[4px] capitalize font-sans tracking-normal">
        {chain.network}
      </span>
    </button>
  );
};
