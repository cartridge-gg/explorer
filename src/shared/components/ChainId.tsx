import { ChainId, StarknetChainId } from "@/types/types";
import useChain from "../hooks/useChain";
import StarknetLogo from "../icons/StarknetLogo";

export default function ChainId() {
  const { chainId } = useChain();

  if (chainId === "SN_MAIN" || chainId === "SN_SEPOLIA") {
    return <StarknetChainIdComponent id={chainId} />;
  }

  return <OtherChainIdComponent id={chainId || ""} />;
}

function StarknetChainIdComponent({ id }: { id: StarknetChainId }) {
  const displayName = id === "SN_MAIN" ? "Mainnet" : "Sepolia";
  return (
    <div className="uppercase text-left flex-row-reverse text-white rounded-md overflow-clip flex bg-starknet-primary px-3 py-1 gap-6 items-center justify-between">
      <StarknetLogo width={13} />
      <div>{displayName}</div>
    </div>
  );
}

function OtherChainIdComponent({ id }: { id: ChainId }) {
  return (
    <div className="w-[136px] uppercase text-left text-white rounded-md overflow-clip flex bg-starknet-primary px-3 py-1 items-center justify-end">
      <div>{id}</div>
    </div>
  );
}
