import { useAccount } from "@starknet-react/core";
import { truncateString } from "@/shared/utils/string";
import WalletIcon from "../icons/WalletIcon";
import { useCallback, useMemo, useRef, useState, HTMLAttributes } from "react";
import WalletConnectModal from "./wallet_connect";
import { AccountModal } from "./AccountModal";
import { useCallCart } from "@/store/ShoppingCartProvider";

export default function AccountDisplay(props: HTMLAttributes<HTMLDivElement>) {
  const { state } = useCallCart();
  const { address, status } = useAccount();

  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
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
      setIsCartModalOpen(true);
    } else {
      setIsWalletModalOpen(true);
    }
  }, [status]);

  const handleMouseEnter = () => {
    if (status === "connected" && textRef.current) {
      textRef.current.innerText = "Account";
    }
  };

  const handleMouseLeave = () => {
    if (status === "connected" && textRef.current) {
      textRef.current.innerText = statusText;
    }
  };

  const classes = `relative bg-white hover:bg-primary hover:text-white hover:border-primary w-[122px] border border-borderGray font-bold flex px-3 py-1 gap-3 items-center justify-between cursor-pointer ${
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
        {status === "connected" && state.calls.length > 0 && (
          <span className="absolute -top-2 -left-2 bg-primary text-white text-xs w-4 h-4 flex items-center justify-center">
            {state.calls.length}
          </span>
        )}
      </div>

      {/* Wallet Connection Modal */}
      <WalletConnectModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />

      {/* Account Modal */}
      <AccountModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
      />
    </>
  );
}
