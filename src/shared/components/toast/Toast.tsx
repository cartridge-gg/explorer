import { ReactNode, useCallback, useEffect, useState } from "react";
import { cn } from "@cartridge/ui-next";
import * as icons from "lucide-react";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastType {
  id: string;
  message: string | ReactNode;
  variant: ToastVariant;
  duration?: number;
}

export interface ToastProps extends ToastType {
  onClose: () => void;
}

export const Toast = ({
  message,
  variant,
  duration = 3000,
  onClose,
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow animation to complete before removing
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getColors = useCallback(() => {
    switch (variant) {
      case "success":
        return {
          bgColor: "bg-white",
          textColor: "text-primary",
          borderColor: "border-borderGray",
        };
      case "error":
        return {
          bgColor: "bg-white",
          borderColor: "border-borderGray",
          textColor: "text-primary",
        };
      case "warning":
        return {
          bgColor: "bg-white",
          borderColor: "border-borderGray",
          textColor: "text-primary",
        };
      case "info":
      default:
        return {
          bgColor: "bg-white",
          borderColor: "border-borderGray",
          textColor: "text-primary",
        };
    }
  }, [variant]);

  const { bgColor, borderColor, textColor } = getColors();

  return (
    <div
      className={cn(
        "w-full text-sm flex items-center gap-2 px-2 py-1 mb-1 shadow-sm transition-all duration-300 ease-in-out border",
        bgColor,
        textColor,
        borderColor,
        isVisible ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0",
      )}
      role="alert"
    >
      <button
        type="button"
        className="text-primary hover:outline hover:outline-1 hover:outline-borderGray"
        aria-label="Close"
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
      >
        <span className="sr-only">Close</span>
        <icons.X strokeWidth={1.5} width={10} height={10} />
      </button>

      <div className="w-full max-w-xs text-sm font-medium break-words">
        {message}
      </div>
    </div>
  );
};
