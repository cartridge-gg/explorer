export {
  Dialog,
  DialogHeader,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogDescription,
} from "@cartridge/ui";

import React from "react";
import { forwardRef, ElementRef, ComponentPropsWithoutRef } from "react";
import { TimesIcon } from "@cartridge/ui";
import { DialogPortal, DialogOverlay } from "@cartridge/ui";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@cartridge/ui/utils";

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay className="backdrop-blur" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 w-full translate-x-[-50%] translate-y-[-50%] gap-4 border-2 border-background-200 bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-w-[90%] sm:max-w-[400px] min-h-[464px] max-h-[70%] overflow-y-auto pt-20 flex flex-col",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute left-3 top-3 p-2 bg-background-200 hover:bg-background-300 rounded-md transition-opacity focus:outline-none disabled:pointer-events-none data-[state=open]:bg-background-500 data-[state=open]:text-foreground-400">
        <TimesIcon />
      </DialogPrimitive.Close>{" "}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight capitalize",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
