import { CloneIcon, cn, Skeleton } from "@cartridge/ui";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export interface CopyableTextProps {
  title?: string;
  value: string | undefined;
  containerClassName?: string;
  className?: string;
  onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
  onIconClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
}

export function CopyableText({
  title,
  value,
  containerClassName,
  onClick,
}: CopyableTextProps) {
  const [isHovered, setIsHovered] = useState(false);

  const onCopy = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (onClick) {
        onClick();
        return;
      }

      e.stopPropagation();

      if (!value) {
        return;
      }

      navigator.clipboard.writeText(value);
      toast.success(`${title ?? value ?? "Value"} copied to clipboard`);
    },
    [value, onClick, title],
  );

  if (!value) {
    return <Skeleton className="h-6 w-40" />;
  }

  return (
    <div
      onClick={onCopy}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "flex items-center gap-[6px] font-bold text-foreground cursor-pointer transition-all",
        containerClassName,
      )}
    >
      <span className="text-[13px]/[16px] font-semibold tracking-[0.26px] text-foreground-100">
        {value}
      </span>

      <CloneIcon
        variant={isHovered ? "solid" : "line"}
        className="text-foreground-400 w-[18px] h-[18px]"
      />
    </div>
  );
}
