import {
  CloneIcon,
  cn,
  ExternalIcon,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@cartridge/ui";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function Hash({
  value,
  length = 4,
  to,
  containerClassName,
  className,
}: {
  value: string | undefined;
  length?: number;
  to?: string;
  containerClassName?: string;
  className?: string;
}) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const onCopy = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();

      if (!value) {
        return;
      }

      navigator.clipboard.writeText(value);
      toast.success("Address copied to clipboard");
    },
    [value],
  );

  const onNavigate = useCallback(() => {
    if (!to) {
      return;
    }

    navigate(to);
  }, [to, navigate]);

  // Function to split text into chunks of 4 characters
  const formatWithGaps = useCallback((text: string) => {
    const chunks = [];
    for (let i = 0; i < text.length; i += 4) {
      chunks.push(text.slice(i, i + 4));
    }
    return chunks;
  }, []);

  if (!value) {
    return <Skeleton className="h-6 w-40" />;
  }

  // Custom truncation logic based on chunks
  const totalCharsPerSide = length * 4;
  const shouldTruncate = value.length > totalCharsPerSide * 2;

  let first = "";
  let last = "";

  if (shouldTruncate) {
    first = value.slice(0, totalCharsPerSide);
    last = value.slice(-totalCharsPerSide);
  } else {
    first = value;
  }

  const firstChunks = formatWithGaps(first);
  const lastChunks = last ? formatWithGaps(last) : [];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          onClick={to ? onNavigate : onCopy}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "flex items-center gap-[6px] font-mono font-bold text-foreground cursor-pointer transition-all",
            containerClassName,
          )}
        >
          <div
            className={cn(
              "flex items-center border-b border-transparent gap-[6px]",
              className,
            )}
          >
            {/* Render first part chunks */}
            {firstChunks.map((chunk, index) => (
              <span
                className="text-[13px]/[16px] font-semibold tracking-[0.26px] text-foreground-100"
                key={`first-${index}`}
              >
                {chunk}
              </span>
            ))}

            {/* Render dots if there's a last part */}
            {lastChunks.length > 0 && (
              <span className="text-foreground-200 font-mono text-[12px]/[16px] font-normal">
                ...
              </span>
            )}

            {/* Render last part chunks */}
            {lastChunks.map((chunk, index) => (
              <span
                className="text-[13px]/[16px] font-semibold tracking-[0.26px] text-foreground-100"
                key={`last-${index}`}
              >
                {chunk}
              </span>
            ))}
          </div>

          {to ? (
            <ExternalIcon className="text-foreground-400 !w-[18px] !h-[18px]" />
          ) : (
            <CloneIcon
              variant={isHovered ? "solid" : "line"}
              className="text-foreground-400 w-[18px] h-[18px]"
            />
          )}
        </TooltipTrigger>

        <TooltipContent
          className={cn("bg-background-200 text-foreground-200")}
          onClick={to ? onCopy : undefined}
        >
          {value}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
