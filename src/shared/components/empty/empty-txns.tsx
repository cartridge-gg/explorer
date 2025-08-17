import React from "react";
import { Card, CardContent } from "../card";
import { cn } from "@cartridge/ui";

export const EmptyTransactions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn(
      "border-dashed min-h-[100px] flex items-center justify-center rounded-[5px]",
      className,
    )}
    {...props}
  >
    <CardContent className="flex items-center justify-center">
      <p className="text-[13px]/[16px] font-normal text-foreground-400">
        Data not available
      </p>
    </CardContent>
  </Card>
));
EmptyTransactions.displayName = "EmptySignature";
