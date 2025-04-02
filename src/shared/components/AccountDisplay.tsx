import { useAccount, useDisconnect } from "@starknet-react/core";
import { truncateString } from "@/shared/utils/string";
import WalletIcon from "../icons/WalletIcon";
import { useCallback, useMemo, useRef, useState, HTMLAttributes } from "react";
import WalletConnectModal from "./wallet_connect";

export default function AccountDisplay(props: HTMLAttributes<HTMLDivElement>) {
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

  const classes = `bg-white hover:bg-primary hover:text-white hover:border-0 w-[122px] border border-borderGray font-bold flex px-3 py-1 gap-3 items-center justify-between cursor-pointer ${
    props.className || ""
  } ${status === "connected" ? "" : "uppercase"} `;

  return (
    <>
      <div
        {...props}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={classes}
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
