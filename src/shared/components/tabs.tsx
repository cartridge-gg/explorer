import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@cartridge/ui";

export const Tabs = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Tabs>) => {
  return (
    <TabsPrimitive.Tabs
      className={cn("flex flex-col h-full", className)}
      {...props}
    />
  );
};

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn("w-full inline-flex h-9 items-center p-1", className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap px-3 py-2 ont-medium transition-all font-semibold text-foreground-300 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-2 border-primary data-[state=active]:text-primary data-[state=active]:shadow gap-2",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-2 overflow-auto", className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
