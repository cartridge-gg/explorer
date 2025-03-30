import { ChainId, StarknetChainId } from "@/types/types";
import useChain from "../hooks/useChain";

export default function ChainDisplay() {
  const { chainId } = useChain();

  if (chainId === "SN_MAIN" || chainId === "SN_SEPOLIA") {
    return <StarknetChainIdComponent id={chainId} />;
  } else {
    return <OtherChainIdComponent id={chainId || ""} />;
  }
}

function StarknetChainIdComponent({ id }: { id: StarknetChainId }) {
  const displayName = id === "SN_MAIN" ? "Mainnet" : "Sepolia";
  return (
    <div className="w-[105px] border border-borderGray uppercase text-right flex-row-reverse font-bold overflow-clip flex bg-white px-3 py-1 gap-6 items-center justify-between">
      <div>{displayName}</div>
      <div className="w-[9px] h-[9px] bg-starknet-primary"></div>
    </div>
  );
}

function OtherChainIdComponent({ id }: { id: ChainId }) {
  return (
    <div className="w-[105px] border border-borderGray w-[136px] uppercase text-right overflow-clip font-bold flex px-3 py-1 items-center justify-end">
      <div>{id}</div>
      <div className="w-[9px] h-[9px] bg-primary"></div>
    </div>
  );
}
