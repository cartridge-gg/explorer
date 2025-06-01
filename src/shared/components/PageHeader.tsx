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
    <div className="overflow-clip" {...props}>
      <div
        className={cn(
          "px-4 w-full justify-between bg-background-400 h-[40px] flex items-center",
          subtext ? "rounded-t border-b border-background-500" : "rounded",
        )}
      >
        <h1 className="capitalize text-lg font-bold">{title}</h1>
        {titleRightComponent ? titleRightComponent : null}
      </div>

      {subtext && (
        <div className="bg-background-400 text-foreground-200 px-4 w-full justify-between h-[25px] flex items-center rounded-b">
          <div className="text-sm">{subtext}</div>
          {subtextRightComponent ? subtextRightComponent : null}
        </div>
      )}
    </div>
  );
}
