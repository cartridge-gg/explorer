import { useCallback, useMemo, useState } from "react";
import { Card, CardContent } from "./card";
import { CloneIcon, cn, WedgeIcon } from "@cartridge/ui";
import { toast } from "sonner";
import { To, useNavigate } from "react-router-dom";

export interface AccountAddressV2Props {
  address: string;
  containerClassName?: string;
  className?: string;
  to?: To;
}

const LENGTH = 2;
const TOTAL_CHAR_PER_SIDE = LENGTH * 4;

export const AccountAddressV2 = ({
  address,
  containerClassName,
  className,
  to,
}: AccountAddressV2Props) => {
  const [isHovered, setIsHovered] = useState(false);

  const navigate = useNavigate();

  const formatWithGaps = useCallback((text: string) => {
    const chunks = [];
    for (let i = 0; i < text.length; i += 4) {
      chunks.push(text.slice(i, i + 4));
    }
    return chunks;
  }, []);

  // Custom truncation logic based on chunks
  const shouldTruncate = useMemo(
    () => address.length > TOTAL_CHAR_PER_SIDE * 2,
    [address],
  );

  const { first, last } = useMemo(() => {
    let first = "";
    let last = "";
    if (shouldTruncate) {
      first = address.slice(0, TOTAL_CHAR_PER_SIDE);
      last = address.slice(-TOTAL_CHAR_PER_SIDE);
    } else {
      first = address;
    }
    return { first, last };
  }, [address, shouldTruncate]);

  const firstChunks = formatWithGaps(first);
  const lastChunks = last ? formatWithGaps(last) : [];

  const onNavigate = useCallback(() => {
    if (!address || !to) {
      return;
    }
    navigate(to);
  }, [to, address, navigate]);

  const onCopy = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();

      if (!address) {
        return;
      }

      navigator.clipboard.writeText(address);
      toast.success("Account address copied to clipboard");
    },
    [address],
  );

  return (
    <Card
      className={cn(
        "flex flex-row justify-between rounded-sm border border-background-500 cursor-pointer divide-x divide-background-500 gap-0 p-0 h-[27px]",
        containerClassName,
      )}
    >
      <CardContent
        className={cn(
          "flex flex-row items-center justify-between bg-background-200 hover:bg-background-300 py-[4px] pl-[30px] pr-[10px] min-w-[267px] w-full",
          className,
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onCopy}
      >
        <div className="space-x-[6px]">
          {/* Render first part chunks */}
          {firstChunks.map((chunk, index) => (
            <span
              className="font-mono text-[13px]/[16px] font-semibold tracking-[0.26px] text-foreground-100"
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
              className="font-mono text-[13px]/[16px] font-semibold tracking-[0.26px] text-foreground-100"
              key={`last-${index}`}
            >
              {chunk}
            </span>
          ))}
        </div>
        <CloneIcon
          className="text-foreground-400"
          variant={isHovered ? "solid" : "line"}
        />
      </CardContent>
      <CardContent
        className="bg-background-200 hover:bg-background-300 py-[4px] pl-[9px] pr-[10px] group w-[40px] h-[27px]"
        onClick={onNavigate}
      >
        <WedgeIcon
          variant="right"
          className="!w-[22px] !h-[22px] group-hover:!w-[24px] group-hover:!h-[24px] text-background-500 transition-all"
        />
      </CardContent>
    </Card>
  );
};
