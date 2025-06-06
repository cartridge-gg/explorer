import { Card, CardContent } from "@/shared/components/card";
import { cn } from "@cartridge/ui";
import { ReactNode } from "react";

export function PageHeader({
  children,
  className,
  containerClassName,
}: {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  return (
    <Card
      className={cn(
        "w-full rounded-xl rounded-b-none relative h-10 p-0",
        containerClassName,
      )}
    >
      <CardContent
        className={cn("h-full flex flex-row items-center", className)}
      >
        {children}
      </CardContent>
    </Card>
  );
}

export function PageHeaderTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 text-foreground font-medium",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeaderRight({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center absolute right-0", className)}>
      {children}
    </div>
  );
}
