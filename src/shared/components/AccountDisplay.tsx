import { useAccount, useDisconnect } from "@starknet-react/core";
import { truncateString } from "@/shared/utils/string";
import WalletIcon from "../icons/WalletIcon";
import { useCallback, useMemo, useRef, useState } from "react";
import WalletConnectModal from "./wallet_connect";

export default function AccountDisplay() {
  const { address, status } = useAccount();
  const { disconnect } = useDisconnect();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const textRef = useRef(null);

  const statusText = useMemo(
    () =>
      status === "connected" && address
        ? truncateString(address, 3)
        : status === "connecting"
        ? "Connecting..."
        : "Connect",

    [address, status]
  );

  const handleClick = useCallback(() => {
    if (status === "connected") {
      disconnect();
    } else {
      setIsWalletModalOpen(true);
    }
  }, [disconnect, status]);

  const handleMouseEnter = () => {
    if (status === "connected" && textRef.current) {
      textRef.current.innerText = "Disconnect";
    }
  };

  const handleMouseLeave = () => {
    if (status === "connected" && textRef.current) {
      textRef.current.innerText = statusText;
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`bg-white hover:bg-primary hover:text-white hover:border-0 w-[122px] border border-borderGray font-bold flex px-3 py-1 gap-3 items-center justify-between cursor-pointer relative ${
          status === "connected" ? "" : "uppercase"
        }`}
      >
        <WalletIcon />
        <span ref={textRef}>{statusText}</span>
      </div>

      {/* Wallet Connection Modal */}
      <WalletConnectModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  );
}
