import { useAccount } from "@starknet-react/core";
import { ConnectButton } from "./connect";
import { Button, Spinner } from "@cartridge/ui";
import { useScreen } from "@/shared/hooks/useScreen";
import { Connected } from "./connected";

export function Account() {
  const { isMobile } = useScreen();
  const { status } = useAccount();

  switch (status) {
    case "connected":
      return <Connected />;
    case "connecting":
      return (
        <Button
          disabled
          variant="outline"
          className="gap-3 text-md h-12 w-12 p-0 sm:p-6 sm:w-auto hover:bg-transparent hover:text-foreground group"
          size={isMobile ? "icon" : "default"}
        >
          <Spinner />
          <span className="hidden sm:block animate-pulse">connecting...</span>
        </Button>
      );
    default:
      return <ConnectButton />;
  }
}
