import { useAccount } from "@starknet-react/core";
import { truncateString } from "@/shared/utils/string";
import { useCallback, useMemo, useState, useEffect } from "react";
import { WalletConnectModal } from "./WalletConnect";
import { AccountModal } from "./AccountModal";
import { useCallCart } from "@/store/ShoppingCartProvider";
import ControllerConnector from "@cartridge/connector/controller";
import { Button, Network, Separator, Spinner, WalletIcon } from "@cartridge/ui";
import useChain from "@/shared/hooks/useChain";
import { useScreen } from "@/shared/hooks/useScreen";

export default function AccountDisplay() {
  const { isMobile } = useScreen();
  const { state } = useCallCart();
  const { address, status, connector } = useAccount();
  const { id: chainId } = useChain();
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

  const statusText = useMemo(
    () =>
      status === "connected" && address
        ? (username ?? truncateString(address, 3))
        : status === "connecting"
          ? "Connecting..."
          : "Connect",

    [address, status, username],
  );

  const onClick = useCallback(() => {
    setIsCartModalOpen(status === "connected");
  }, [status]);

  return (
    <>
      <div className="flex items-center gap-4">
        {chainId && (
          <Network
            chainId={chainId.id}
            tooltipTriggerClassName="bg-background-300 hover:bg-background-200 h-12 text-md"
          />
        )}

        <Separator
          orientation="vertical"
          className="bg-background-400 w-1 h-8"
        />

        {(() => {
          switch (status) {
            case "connected":
              return (
                <Button
                  variant="outline"
                  className="relative gap-3 text-md h-12 w-12 p-0 sm:p-6 sm:w-48 hover:bg-transparent hover:text-foreground hover:cursor-pointer group justify-between"
                  onClick={onClick}
                  size={isMobile ? "icon" : "default"}
                >
                  {state.calls.length > 0 && (
                    <span className="absolute -top-2 -left-2 bg-primary text-xs w-4 h-4 flex items-center justify-center">
                      {state.calls.length}
                    </span>
                  )}
                  <img src={icon} alt="controller" className="size-4" />
                  <span className="hidden sm:block group-hover:hidden">
                    {statusText}
                  </span>
                  <span className="hidden group-hover:sm:block">Account</span>
                </Button>
              );
            case "connecting":
              return (
                <Button
                  disabled
                  variant="outline"
                  className="gap-3 text-md h-12 w-12 p-0 sm:p-6 sm:w-auto hover:bg-transparent hover:text-foreground group"
                  onClick={onClick}
                  size={isMobile ? "icon" : "default"}
                >
                  <Spinner />
                  <span className="hidden sm:block animate-pulse">
                    connecting...
                  </span>
                </Button>
              );
            default:
              return (
                <Button
                  variant="outline"
                  className="border-primary text-primary gap-3 text-md h-12 w-12 p-0 sm:p-4 sm:w-auto hover:bg-transparent hover:text-primary-200 hover:border-primary-200"
                  onClick={onClick}
                  size={isMobile ? "icon" : "default"}
                >
                  <WalletIcon variant="solid" />
                  <span className="hidden sm:block">connect</span>
                </Button>
              );
          }
        })()}
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
