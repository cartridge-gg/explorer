import { useNetwork } from "@starknet-react/core";
import { Button, cn } from "@cartridge/ui";
import { Chain } from "@starknet-react/chains";

const ChainColors: Record<Chain["network"], string> = {
  mainnet: "#FF4264",
  sepolia: "#6DE27C",
  localhost: "#9C9C9C",
};

export const Network = () => {
  const { chain } = useNetwork();

  return (
    <Button className="p-[10px] min-w-[112px] gap-0.5 rounded-sm bg-background-100 hover:bg-background-150 flex items-center justify-start h-auto">
      <span
        className={cn(
          "size-[8px] aspect-square rounded-full m-[6px] self-center",
        )}
        style={{
          backgroundColor:
            ChainColors[chain.network.toLowerCase()] || "#FBCB4A",
        }}
      />
      <span className="text-foreground-200 overflow-hidden text-center overflow-ellipsis whitespace-nowrap text-sm font-medium px-[4px] capitalize font-sans tracking-normal">
        {chain.network}
      </span>
    </Button>
  );
};
