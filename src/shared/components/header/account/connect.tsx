import { useCallback, useEffect, useState } from "react";
import { Connector, useConnect } from "@starknet-react/core";
import { connectorIconToSrc } from "@/shared/utils/image";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Skeleton,
  Spinner,
  WalletIcon,
} from "@cartridge/ui";
import { cn } from "@cartridge/ui/utils";
import { useScreen } from "@/shared/hooks/useScreen";

export function ConnectButton() {
  const { isMobile } = useScreen();
  const { connectAsync, connectors } = useConnect();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const onConnect = useCallback(
    async (connector: Connector) => {
      try {
        setConnecting(connector.id);
        await connectAsync({ connector });
        localStorage.setItem("lastUsedConnector", connector.id);
      } catch (error) {
        console.error("Connection error:", error);
        localStorage.removeItem("lastUsedConnector");
      } finally {
        setConnecting(null);
      }
    },
    [connectAsync],
  );

  useEffect(() => {
    const lastUsedConnector = localStorage.getItem("lastUsedConnector");
    if (lastUsedConnector) {
      const connector = connectors.find((c) => c.id === lastUsedConnector);
      if (connector) {
        onConnect(connector).then(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [connectors, onConnect]);

  if (isLoading) {
    return <Skeleton className="h-12 w-48" />;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-primary text-primary gap-3 text-md h-12 w-12 p-0 sm:p-4 sm:w-auto hover:bg-transparent hover:text-primary-200 hover:border-primary-200 justify-center sm:justify-between"
          size={isMobile ? "icon" : "default"}
        >
          <WalletIcon variant="solid" />
          <span className="hidden sm:block">connect</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90%] sm:max-w-[400px] pt-20 border-2 border-background-200">
        <DialogHeader className="gap-2">
          <DialogTitle className="uppercase">Connect</DialogTitle>
          <DialogDescription>Connect your wallet to continue</DialogDescription>
        </DialogHeader>

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
                  "mt-[-1px] flex items-center justify-between w-full p-3 border hover:bg-background-300 disabled:hover:bg-background disabled:cursor-not-allowed transition-colors",
                  connecting === connector.id
                    ? "border-background-200"
                    : "border-background-200 hover:border-background-300",
                )}
              >
                <div className="w-full flex items-center">
                  <img
                    src={connectorIconToSrc(connector.icon)}
                    alt={`${connector.name} logo`}
                    className="size-6 mr-3"
                  />
                  <span className="font-medium">{connector.name}</span>
                </div>

                {connecting === connector.id && <Spinner size="lg" />}
              </button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
