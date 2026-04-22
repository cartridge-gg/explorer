"use client";

import { useMemo } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useMemo(
    () =>
      (localStorage.getItem("vite-ui-colorScheme") ??
        "system") as ToasterProps["theme"],
    [],
  );
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      duration={1000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-foreground-400",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-background-200 group-[.toast]:text-foreground-400",
        },
      }}
      {...props}
    />
  );
};
