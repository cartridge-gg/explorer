import { useCallback, useEffect, useState } from "react";
import { Connector, useConnect } from "@starknet-react/core";
import { connectorIconToSrc } from "@/shared/utils/image";
import { cn } from "@cartridge/ui/utils";
import { ModalTitle, Modal } from "./Modal";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletConnectModal({
  isOpen,
  onClose,
}: WalletConnectModalProps) {
  const { connectAsync, connectors } = useConnect();
  const [connecting, setConnecting] = useState<string | null>(null);

  const onConnect = useCallback(
    async (connector: Connector) => {
      try {
        setConnecting(connector.id);
        await connectAsync({ connector });
        localStorage.setItem("lastUsedConnector", connector.id);
        onClose();
      } catch (error) {
        console.error("Connection error:", error);
        localStorage.removeItem("lastUsedConnector");
      } finally {
        setConnecting(null);
      }
    },
    [connectAsync, onClose],
  );

  useEffect(() => {
    const lastUsedConnector = localStorage.getItem("lastUsedConnector");
    if (!lastUsedConnector) {
      return;
    }
    const connector = connectors.find((c) => c.id === lastUsedConnector);
    if (!connector) {
      return;
    }
    onConnect(connector);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectors]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalTitle title="Connect" />
      <div className="w-[380px] max-w-2xl max-h-[50vh]">
        <div>
          {connectors
            .sort((a, b) => {
              if (a.id === "controller") return -1;
              if (b.id === "controller") return 1;
              return 0;
            })
            .map((connector) => (
              <button
                key={connector.id}
                onClick={() => onConnect(connector)}
                disabled={!!connecting}
                className={cn(
                  "mt-[-1px] flex items-center justify-between w-full p-3 border hover:bg-[#EEEEEE] transition-colors",
                  connecting === connector.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300",
                )}
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
            ))}
        </div>
      </div>
    </Modal>
  );
}
