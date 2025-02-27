import { useState } from "react";
import { useConnect } from "@starknet-react/core";
import {
  availableConnectors,
  cartridge_controller,
} from "@/store/starknetProvider";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Map wallet names to their SVG logo paths
const walletLogos: Record<string, string> = {
  "Cartridge Controller": "/controller.svg",
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
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {availableConnectors.map((connector) => {
            const name = connector.id || connector.name || "Unknown";
            const displayName =
              name === "controller"
                ? "Cartridge Controller"
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
                className={`flex items-center justify-between w-full p-4 border ${
                  connecting === name
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                } rounded-lg transition-colors`}
              >
                <div className="flex items-center">
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

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            New to Starknet?{" "}
            <span
              onClick={() => handleConnect(cartridge_controller)}
              className="text-blue-500 hover:underline cursor-pointer"
            >
              Create a Cartridge wallet
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
