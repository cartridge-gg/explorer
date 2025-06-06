import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@cartridge/ui";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm text-xs font-semibold transition-colors focus:outline-none capitalize",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-background-200 text-foreground hover:bg-background-200 text-foreground-200",
      },
      size: {
        default: "px-2 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
