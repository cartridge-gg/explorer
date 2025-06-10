import { truncateString } from "@/shared/utils/string";
import {
  cn,
  CopyIcon,
  DotsIcon,
  ExternalIcon,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@cartridge/ui";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function Hash({
  value,
  length = 4,
  to,
}: {
  value: string;
  length?: number;
  to?: string;
}) {
  const [first, last] = truncateString(value, length).split("...");
  const navigate = useNavigate();

  const onCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    toast.success("Address copied to clipboard");
  }, [value]);

  const onNavigate = useCallback(() => {
    if (!to) {
      return;
    }

    navigate(to);
  }, [to, navigate]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          onClick={to ? onNavigate : onCopy}
          className="flex items-center gap-1 font-mono font-bold text-foreground hover:text-foreground-200 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-1 border-b border-transparent px-2">
            <span>{first}</span>
            {!!last?.length && (
              <>
                <DotsIcon className="text-foreground-300 hover:text-foreground-400" />
                <span>{last}</span>
              </>
            )}
          </div>

          {to ? (
            <ExternalIcon
              size="sm"
              className="text-foreground-300 hover:text-foreground-400"
            />
          ) : (
            <CopyIcon
              size="sm"
              className="text-foreground-300 hover:text-foreground-400"
            />
          )}
        </TooltipTrigger>

        <TooltipContent
          className={cn(
            "bg-background-200 text-foreground-200 flex gap-1 items-center hover:text-foreground-400",
            to && "cursor-pointer",
          )}
          onClick={to ? onCopy : undefined}
        >
          {value}
          {to && <CopyIcon size="sm" />}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
