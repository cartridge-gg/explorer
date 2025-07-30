import React, { memo, useCallback } from "react";
import { cn, Skeleton } from "@cartridge/ui";
import { abbreviateNumber } from "../utils/number";
import { toast } from "sonner";
import * as RPC08 from "@starknet-io/starknet-types-08";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex py-3 gap-2 flex-col rounded overflow-hidden bg-background text-foreground border border-background-200 shrink-0",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex px-3 items-center", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardIcon = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLDivElement> & { icon?: React.ReactNode }
>(({ className, icon, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "h-8 aspect-square flex items-center justify-center",
      className,
    )}
    {...props}
  >
    {icon ?? children}
  </div>
));
CardIcon.displayName = "CardIcon";

export const CardSeparator = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    variant?: "horizontal" | "vertical";
  }
>(({ variant = "horizontal", className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-background-200",
      variant === "horizontal" ? "w-full h-px my-2" : "h-full w-px mx-2",
      className,
    )}
    {...props}
  />
));
CardSeparator.displayName = "CardSeparator";

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-mg font-semibold tracking-wide px-3 capitalize",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardLabel = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-foreground-400 font-semibold tracking-wide capitalize text-nowrap text-sm",
      className,
    )}
    {...props}
  />
));
CardLabel.displayName = "CardLabel";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative px-3 flex flex-col gap-2 text-foreground-200",
      className,
    )}
    {...props}
  />
));
CardContent.displayName = "CardContent";

export function ExecutionResourcesCard({
  blockComputeData,
  isLoading,
}: {
  blockComputeData?: RPC08.EXECUTION_RESOURCES;
  executions?: {
    ecdsa: number;
    keccak: number;
    bitwise: number;
    pedersen: number;
    poseidon: number;
    range_check: number;
    segment_arena: number;
  };
  isLoading?: boolean;
}) {
  return (
    <Card className="gap-0 p-0 rounded-[12px]">
      <CardHeader className="px-[17px] py-[4px] h-[32px] gap-[10px] border-b border-background-200">
        <FireIcon className="!w-[9px] !h-[12px]" />
        <CardTitle className="font-bold text-[12px]">
          Execution resources
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-[10px] pb-[15px] px-[11px] gap-[13px]">
        <CardLabel>gas</CardLabel>
        <div className="flex flex-row gap-px">
          <ResourceCard
            isLoading={isLoading}
            label="L1"
            value={blockComputeData?.l1_gas}
          />
          <ResourceCard
            isLoading={isLoading}
            label="L2"
            value={blockComputeData?.l2_gas}
          />
          <ResourceCard
            isLoading={isLoading}
            label="L1 Data Gas"
            value={blockComputeData?.l1_data_gas}
          />
        </div>
      </CardContent>
    </Card>
  );
}

const FireIcon = memo(({ className }: { className?: string }) => {
  return (
    <svg viewBox="0 0 9 12" fill="none" className={className}>
      <path
        d="M8.70951 6.35208C7.82618 3.96435 4.68108 3.8356 5.44063 0.365209C5.49689 0.107709 5.23246 -0.091268 5.01866 0.0433341C2.97631 1.29572 1.50785 3.80634 2.74001 7.09531C2.84128 7.36452 2.53746 7.61617 2.31803 7.4406C1.29967 6.63884 1.19278 5.48594 1.2828 4.66077C1.31655 4.35645 0.933965 4.21015 0.770803 4.46179C0.388214 5.07043 0 6.05361 0 7.53423C0.213799 10.8115 2.87504 11.8181 3.83151 11.9468C5.1987 12.1283 6.67842 11.8649 7.74179 10.8525C8.91206 9.72298 9.33965 7.92048 8.70951 6.35208ZM3.4883 9.29577C4.29849 9.09094 4.71484 8.4823 4.82736 7.94389C5.01303 7.10702 4.28724 6.2877 4.77673 4.96509C4.96239 6.05946 6.61653 6.74418 6.61653 7.93804C6.66154 9.41866 5.11993 10.6886 3.4883 9.29577Z"
        fill="white"
      />
    </svg>
  );
});

export const ResourceCard = ({
  className,
  label,
  value,
  isLoading,
}: {
  className?: string;
  label: string;
  value?: number | string;
  isLoading?: boolean;
}) => {
  const onCopyValue = useCallback(() => {
    navigator.clipboard.writeText(value?.toString() || "0");
    toast.success(`${label} value copied to clipboard`);
  }, [label, value]);

  return (
    <button
      type="button"
      className={cn(
        "bg-background-200 hover:bg-background-300 flex flex-col items-start justify-between p-[10px] w-[120px] h-[64px] select-none",
        className,
      )}
      onClick={onCopyValue}
    >
      <CardLabel>{label}</CardLabel>
      {!isLoading ? (
        <p className="font-mono text-foreground font-semibold">
          {typeof value === "number" ? abbreviateNumber(value || 0, 3) : value}
        </p>
      ) : (
        <Skeleton className="h-6 w-full" />
      )}
    </button>
  );
};
