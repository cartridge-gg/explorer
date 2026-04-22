import * as React from "react";
import { SpinnerIcon } from "@cartridge/ui";

import { cn } from "@/lib/utils";

type SpinnerIconProps = React.ComponentPropsWithoutRef<typeof SpinnerIcon>;

export function Spinner({ className, ...props }: SpinnerIconProps) {
  return (
    <SpinnerIcon
      className={cn("animate-spin text-foreground-400", className)}
      {...props}
    />
  );
}
