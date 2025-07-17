import React from "react";
import { Card, CardContent } from "../card";
import { cn } from "@cartridge/ui";

export const EmptySignature = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn(
      "border-dashed min-h-[100px] flex items-center justify-center",
      className,
    )}
    {...props}
  >
    <CardContent className="flex items-center justify-center">
      <p className="text-[11px]/[20px] font-normal text-foreground-400">
        No signatures
      </p>
    </CardContent>
  </Card>
));
EmptySignature.displayName = "EmptySignature";
