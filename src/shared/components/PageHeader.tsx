import { cn } from "@cartridge/ui";
import React from "react";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtext?: React.ReactNode;
  titleRightComponent?: React.ReactNode;
  subtextRightComponent?: React.ReactNode;
}

export function PageHeader({
  title,
  subtext,
  titleRightComponent,
  subtextRightComponent,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className="overflow-clip border border-background-200 rounded"
      {...props}
    >
      <div
        className={cn(
          "px-4 w-full justify-between h-[40px] flex items-center",
          !!subtext && "border-b border-background-200",
        )}
      >
        <h1 className="capitalize font-bold">{title}</h1>
        {titleRightComponent ? titleRightComponent : null}
      </div>

      {subtext && (
        <div className="text-foreground-200 px-4 w-full justify-between h-[25px] flex items-center rounded-b">
          <div className="text-sm">{subtext}</div>
          {subtextRightComponent ? subtextRightComponent : null}
        </div>
      )}
    </div>
  );
}
