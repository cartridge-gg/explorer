import { useCallback, useEffect, useState } from "react";
import { Connector, useConnect } from "@starknet-react/core";
import { connectorIconToSrc } from "@/shared/utils/image";
import { cn, Button, Skeleton, Spinner } from "@cartridge/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/dialog";

export function ConnectButton() {
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
          variant="secondary"
          className="h-[40px] w-[102px] border border-primary-100 text-primary hover:text-spacer bg-background-100 hover:bg-primary transition-colors select-none px-[16px] py-[10px] rounded-sm"
        >
          <span className="font-medium text-[14px]/[20px]">Connect</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect</DialogTitle>
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
