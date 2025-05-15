import { useAccount } from "@starknet-react/core";
import { truncateString } from "@/shared/utils/string";
import WalletIcon from "../icons/WalletIcon";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  HTMLAttributes,
  useEffect,
} from "react";
import { WalletConnectModal } from "./WalletConnect";
import { AccountModal } from "./AccountModal";
import { useCallCart } from "@/store/ShoppingCartProvider";
import ControllerConnector from "@cartridge/connector/controller";

export default function AccountDisplay(props: HTMLAttributes<HTMLDivElement>) {
  const { state } = useCallCart();
  const { address, status, connector } = useAccount();

  const isController = useMemo(
    () => connector && "controller" in connector,
    [connector],
  );
  const [username, setUsername] = useState<string>();
  useEffect(() => {
    if (!isController) {
      setUsername(undefined);
      return;
    }
    (connector as ControllerConnector).controller.username()?.then(setUsername);
  }, [connector, isController]);

  const icon = useMemo(() => {
    if (!connector?.icon) {
      return;
    }
    if (typeof connector?.icon === "string") {
      return connector?.icon;
    }
    return connector?.icon.light;
  }, [connector]);

  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const textRef = useRef(null);

  const statusText = useMemo(
    () =>
      status === "connected" && address
        ? (username ?? truncateString(address, 3))
        : status === "connecting"
          ? "Connecting..."
          : "Connect",

    [address, status, username],
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

  const classes = `relative bg-white hover:bg-primary hover:text-white hover:border-primary aspect-square sm:aspect-auto sm:w-[122px] border border-borderGray font-bold flex px-0 sm:px-3 py-1 gap-3 items-center justify-center sm:justify-between cursor-pointer ${
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
        {icon ? (
          <img className="size-4" src={icon} alt="controller" />
        ) : (
          <WalletIcon />
        )}
        <div className="max-sm:hidden">
          <span ref={textRef}>{statusText}</span>
          {status === "connected" && state.calls.length > 0 && (
            <span className="absolute -top-2 -left-2 bg-primary text-white text-xs w-4 h-4 flex items-center justify-center">
              {state.calls.length}
            </span>
          )}
        </div>
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
