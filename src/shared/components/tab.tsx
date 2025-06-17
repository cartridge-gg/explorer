"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, VariantProps } from "class-variance-authority";
import { cn } from "@cartridge/ui";

const initialTabsContext: TabsContextValue = { variant: "primary", size: "md" };

const tabListVariants = cva(
  "flex sticky top-0 bg-white flex-col sm:flex-row text-center",
  {
    variants: {
      size: {
        sm: "px-4 pb-4",
        md: "p-4",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

const tabsTriggerVariants = cva(
  "border border-b-4 bg-[#fff] uppercase cursor-pointer disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "flex-1 border-[#8E8E8E] text-[#000] data-[state=active]:bg-[#8E8E8E] data-[state=active]:text-[#fff]",
        secondary:
          "data-[state=active]:font-bold data-[state=active]:bg-[#f3f3f3]",
      },
      size: {
        sm: "px-4 py-1",
        md: "p-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

const TabsContext = React.createContext<TabsContextValue>(initialTabsContext);

type TabsContextValue = VariantProps<typeof tabsTriggerVariants>;

export const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> & TabsContextValue
>(
  (
    {
      variant = initialTabsContext.variant,
      size = initialTabsContext.size,
      ...props
    },
    ref,
  ) => (
    <TabsContext.Provider value={{ variant, size }}>
      <TabsPrimitive.Tabs ref={ref} {...props} />
    </TabsContext.Provider>
  ),
);
Tabs.displayName = TabsPrimitive.Root.displayName;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const { size } = React.useContext(TabsContext);
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(tabListVariants({ size, className }))}
      {...props}
    />
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const { variant, size } = React.useContext(TabsContext);
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={tabsTriggerVariants({ variant, size, className })}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = TabsPrimitive.Content;
