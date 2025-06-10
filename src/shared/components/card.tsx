import React from "react";
import { cn } from "@cartridge/ui";

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
