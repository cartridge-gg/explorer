import React from "react";
import { BoltIcon, cn, Skeleton } from "@cartridge/ui";
import { formatNumber } from "../utils/number";
import { formatSnakeCaseToDisplayValue } from "../utils/string";

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
  executions,
}: {
  blockComputeData?: { gas: number; data_gas: number; steps: number };
  executions?: {
    ecdsa: number;
    keccak: number;
    bitwise: number;
    pedersen: number;
    poseidon: number;
    range_check: number;
    segment_arena: number;
  };
}) {
  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="pb-3 border-b border-background-200">
        <CardIcon icon={<BoltIcon variant="solid" />} />
        <CardTitle>Execution resources</CardTitle>
      </CardHeader>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_3fr] divide-y lg:divide-y-0 lg:divide-x divide-background-200">
        {/* Steps Section */}
        <CardContent className="py-4">
          <div>
            <CardLabel>steps</CardLabel>
            {blockComputeData ? (
              <div className="font-mono text-foreground font-semibold overflow-auto">
                {formatNumber(blockComputeData.steps)}
              </div>
            ) : (
              <Skeleton className="h-6 w-40" />
            )}
          </div>
        </CardContent>

        {/* Gas Section */}
        <CardContent className="py-4">
          <CardLabel>gas</CardLabel>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-px mt-2">
            <div className="bg-background-200 flex flex-col p-2">
              <CardLabel>l1</CardLabel>
              {blockComputeData ? (
                <div className="font-mono text-foreground font-semibold">
                  {formatNumber(blockComputeData.gas)}
                </div>
              ) : (
                <Skeleton className="h-6 w-full" />
              )}
            </div>
            <div className="bg-background-200 flex flex-col p-2">
              <CardLabel>l1 data</CardLabel>
              {blockComputeData ? (
                <div className="font-mono text-foreground font-semibold">
                  {formatNumber(blockComputeData.data_gas)}
                </div>
              ) : (
                <Skeleton className="h-6 w-full" />
              )}
            </div>
          </div>
        </CardContent>

        {/* Builtins Counter Section */}
        <CardContent className="py-4">
          <CardLabel>builtins counter</CardLabel>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-px mt-2">
            {Object.entries(executions ?? {}).map(([key, value]) => (
              <div key={key} className="bg-background-200 flex flex-col p-2">
                <CardLabel>{formatSnakeCaseToDisplayValue(key)}</CardLabel>
                <div className="font-mono text-foreground font-semibold overflow-auto">
                  {formatNumber(value)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
