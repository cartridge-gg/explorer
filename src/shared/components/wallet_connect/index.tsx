import { useCallback, useEffect, useState } from "react";
import { Connector, useConnect } from "@starknet-react/core";
import {
  availableConnectors,
} from "@/store/starknetProvider";
import CrossIcon from "@/shared/icons/Cross";
import { connectorIconToSrc } from "@/shared/utils/image";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletConnectModal({
  isOpen,
  onClose,
}: WalletConnectModalProps) {
  const { connect } = useConnect();
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = useCallback((connector: Connector) => {
    try {
      setConnecting(connector.id);
      connect({ connector });
      localStorage.setItem("lastUsedConnector", connector.id);
      onClose();
    } catch (error) {
      console.error("Connection error:", error);
    } finally {
      setConnecting(null);
    }
  }, [connect, onClose]);

  useEffect(() => {
    const lastUsedConnector = localStorage.getItem("lastUsedConnector");
    if (!lastUsedConnector) {
      return
    }
    const connector = availableConnectors.find(c => c.id === lastUsedConnector)
    if (!connector) {
      return
    }
    handleConnect(connector);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isOpen) return null;

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
            return (
              <button
                key={connector.id}
                onClick={() => handleConnect(connector)}
                disabled={!!connecting}
                className={`mt-[-1px] flex items-center justify-between w-full p-3 border hover:bg-[#EEEEEE] ${connecting === connector.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
                  } transition-colors`}
              >
                <div className="w-full flex items-center justify-between">
                  <img
                    src={connectorIconToSrc(connector.icon)}
                    alt={`${connector.name} logo`}
                    className="w-6 h-6 mr-3"
                  />
                  <span className="font-medium">{connector.name}</span>
                </div>

                {connecting === connector.id && (
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
