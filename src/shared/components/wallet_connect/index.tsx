import { useState } from "react";
import { useConnect } from "@starknet-react/core";
import {
  availableConnectors,
  cartridge_controller,
} from "@/store/starknetProvider";
import CrossIcon from "@/shared/icons/ Cross";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Map wallet names to their SVG logo paths
const walletLogos: Record<string, string> = {
  Controller: "/controller.svg",
  "Argent X": "/argent.svg",
  Braavos: "/braavos.svg",
  "Argent Web Wallet": "/argent.svg",
};

export default function WalletConnectModal({
  isOpen,
  onClose,
}: WalletConnectModalProps) {
  const { connect } = useConnect();
  const [connecting, setConnecting] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (connector: any) => {
    try {
      setConnecting(connector.id || connector.name);
      await connect({ connector });
      onClose();
    } catch (error) {
      console.error("Connection error:", error);
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-[15px] pb-5 w-[350px] border border-borderGray shadow-md">
        <div className="flex flex-col gap-5 mb-6">
          <button
            onClick={onClose}
            className="flex items-center justify-center border border-borderGray w-[25px] h-[25px] hover:bg-primary hover:border-0 hover:text-white"
          >
            <CrossIcon />
          </button>
          <h2 className="text-lg font-bold uppercase">Connect A Wallet</h2>
        </div>

        <div className="">
          {availableConnectors.map((connector) => {
            const name = connector.id || connector.name || "Unknown";
            const displayName =
              name === "controller"
                ? "Controller"
                : name === "argentX"
                ? "Argent X"
                : name === "braavos"
                ? "Braavos"
                : name === "argentWebWallet"
                ? "Argent Web Wallet"
                : name;

            return (
              <button
                key={name}
                onClick={() => handleConnect(connector)}
                disabled={!!connecting}
                className={`mt-[-1px] flex items-center justify-between w-full p-3 border hover:bg-[#EEEEEE] ${
                  connecting === name
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                } transition-colors`}
              >
                <div className="w-full flex items-center justify-between">
                  {walletLogos[displayName] && (
                    <img
                      src={walletLogos[displayName]}
                      alt={`${displayName} logo`}
                      className="w-6 h-6 mr-3"
                    />
                  )}
                  <span className="font-medium">{displayName}</span>
                </div>

                {connecting === name && (
                  <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
