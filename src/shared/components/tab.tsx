"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, VariantProps } from "class-variance-authority";
import { cn } from "@cartridge/ui-next";

const initialTabsContext: TabsContextValue = { variant: "primary", size: "md" }

const tabListVariants = cva(
  "flex gap-px bg-[#B0B0B0] border border-[#B0B0B0] flex sticky top-0 flex-col sm:flex-row text-center",
  {
    variants: {
      variant: {
        primary: "",
        secondary: "self-start border rounded-sm overflow-hidden",
      },
      size: {
        sm: "",
        md: ""
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);

const tabsTriggerVariants = cva(
  "bg-[#fff] text-[#B0B0B0] uppercase cursor-pointer disabled:pointer-events-none disabled:opacity-50 font-bold data-[state=active]:bg-[#B0B0B0] data-[state=active]:text-[#fff] data-[state=active]:font-bold data-[state=active]:shadow-[inset_0px_1px_3px_0px_#00000040]",
  {
    variants: {
      variant: {
        primary: "flex-1",
        secondary: "",
      },
      size: {
        sm: "text-xs px-2 py-0.5",
        md: "p-2"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

const TabsContext = React.createContext<TabsContextValue>(initialTabsContext);

type TabsContextValue = VariantProps<typeof tabsTriggerVariants>;

export const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> & TabsContextValue
>(({ variant = initialTabsContext.variant, size = initialTabsContext.size, className, ...props }, ref) => (
  <TabsContext.Provider value={{ variant, size }}>
    <TabsPrimitive.Tabs
      ref={ref}
      {...props}
      className={cn("flex flex-col flex-grow", className)}
    />
  </TabsContext.Provider>
));
Tabs.displayName = TabsPrimitive.Root.displayName;


export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const { size, variant } = React.useContext(TabsContext);
  switch (variant) {
    case "primary":
      return (
        <div className="top-0 sticky border border-borderGray rounded-t-md p-4 pt-8 mb-2 bg-white z-10" style={{
          borderBottom: "dashed",
          borderBottomColor: "#B0B0B0",
        }}>
          <TabsPrimitive.List
            ref={ref}
            className={cn(
              tabListVariants({ size, variant, className }),
            )}
            {...props}
          />
        </div>
      );
    case "secondary":
      return (
        <TabsPrimitive.List
          ref={ref}
          className={cn(tabListVariants({ size, variant, className }))}
          {...props}
        />
      );
    default:
      return null;
  }
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
  )
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const tabsContentVariants = cva(
  "",
  {
    variants: {
      variant: {
        primary: "border border-borderGray rounded-b-md p-4",
        secondary: "",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & TabsContextValue
>(({ className, variant = initialTabsContext.variant, ...props }, ref) => {
  return <TabsPrimitive.Content ref={ref} className={cn(tabsContentVariants({ variant, className }))} {...props} />
});
TabsContent.displayName = TabsPrimitive.Content.displayName;
